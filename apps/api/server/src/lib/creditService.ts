import { PoolClient } from 'pg'
import { query, queryOne, withTransaction } from './db'
import { notifyLowBalance } from './creditNotificationEmail'

// REGLA DE ORO: todo en céntimos (enteros), nunca en coma flotante. Todo
// cobro pasa por chargeCredit() — ningún servicio descuenta saldo directamente.
export const MARGIN = 1.30 // 30% de margen, constante única en todo el sistema
const INITIAL_BONUS_CENTS = 5000 // 50,00€

export type CreditService = 'anthropic' | 'openrouter' | 'retell' | 'ycloud'

export class InsufficientCreditError extends Error {
  constructor(public clinicId: string) {
    super(`Saldo insuficiente para la clínica ${clinicId}`)
    this.name = 'InsufficientCreditError'
  }
}

export interface CreditAccount {
  id: string
  clinic_id: string
  balance_cents: string // BIGINT llega como string desde pg — nunca convertir a Number para aritmética
  last_recharge_amount_cents: string
  auto_recharge: boolean
  auto_recharge_amount_cents: string
  auto_recharge_threshold_pct: string
  stripe_payment_method_id: string | null
  low_balance_20_notified_at: string | null
  low_balance_10_notified_at: string | null
  low_balance_5_notified_at: string | null
}

// Redondeo del margen: SIEMPRE hacia arriba, para que el margen del 30%
// nunca se quede corto por redondeo (Math.ceil, nunca Math.round).
export function computeChargeCents(realCostCents: number): number {
  return Math.ceil(realCostCents * MARGIN)
}

export async function getOrCreateAccount(clinicId: string): Promise<CreditAccount> {
  const existing = await queryOne<CreditAccount>('SELECT * FROM clinic_credit_accounts WHERE clinic_id = $1', [clinicId])
  if (existing) return existing
  // Creación perezosa con el bono de bienvenida — ON CONFLICT por si dos
  // peticiones concurrentes intentan crearla a la vez para la misma clínica.
  const created = await queryOne<CreditAccount>(
    `INSERT INTO clinic_credit_accounts (clinic_id, balance_cents, last_recharge_amount_cents)
     VALUES ($1, $2, $2)
     ON CONFLICT (clinic_id) DO UPDATE SET clinic_id = EXCLUDED.clinic_id
     RETURNING *`,
    [clinicId, INITIAL_BONUS_CENTS]
  )
  if (!created) throw new Error('No se pudo crear la cuenta de crédito')
  const alreadyLogged = await queryOne('SELECT id FROM credit_transactions WHERE clinic_id = $1 LIMIT 1', [clinicId])
  if (!alreadyLogged) {
    await query(
      `INSERT INTO credit_transactions (clinic_id, transaction_type, amount_cents, balance_after_cents, notes)
       VALUES ($1, 'recarga', $2, $2, 'Bono inicial de bienvenida')`,
      [clinicId, INITIAL_BONUS_CENTS]
    )
  }
  return created
}

// Verificación previa (punto 3 del documento de requisitos): comprobación
// RÁPIDA de "hay saldo, adelante" antes de gastar dinero real llamando al
// proveedor externo. NO sustituye el cálculo exacto y el bloqueo de fila de
// chargeCredit() — solo evita ejecutar servicios que luego no se podrán cobrar.
export async function hasPositiveBalance(clinicId: string): Promise<boolean> {
  const account = await getOrCreateAccount(clinicId)
  return BigInt(account.balance_cents) > 0n
}

// ÚNICO punto de descuento de saldo de todo el sistema. Se llama DESPUÉS de
// recibir la respuesta real del proveedor (Anthropic/OpenRouter/Retell/
// YCloud), una vez se conoce el coste exacto.
export async function chargeCredit(
  clinicId: string,
  service: CreditService,
  realCostCents: number,
  referenceId: string | null
): Promise<number> {
  if (!Number.isFinite(realCostCents) || realCostCents < 0) {
    throw new Error(`realCostCents inválido: ${realCostCents}`)
  }
  const chargeCents = computeChargeCents(realCostCents)

  return withTransaction(async (client: PoolClient) => {
    // Asegura que la cuenta existe ANTES del bloqueo (INSERT..ON CONFLICT no
    // necesita FOR UPDATE) — si no existía, se crea con el bono inicial.
    await getOrCreateAccount(clinicId)

    // Bloqueo de fila: ninguna otra llamada a chargeCredit() de esta misma
    // clínica puede leer/escribir su saldo hasta que termine esta transacción.
    // Esto es lo que impide que dos llamadas simultáneas gasten el mismo saldo.
    const { rows } = await client.query<CreditAccount>(
      'SELECT * FROM clinic_credit_accounts WHERE clinic_id = $1 FOR UPDATE', [clinicId]
    )
    const account = rows[0]
    if (!account) throw new Error(`Cuenta de crédito no encontrada para la clínica ${clinicId}`)

    const balance = BigInt(account.balance_cents)
    const charge = BigInt(chargeCents)
    if (balance < charge) {
      throw new InsufficientCreditError(clinicId)
      // El agente NO responde — servicio bloqueado hasta recarga.
    }
    const newBalance = balance - charge

    await client.query(
      'UPDATE clinic_credit_accounts SET balance_cents = $1, updated_at = NOW() WHERE clinic_id = $2',
      [newBalance.toString(), clinicId]
    )
    await client.query(
      `INSERT INTO credit_transactions
         (clinic_id, transaction_type, amount_cents, balance_after_cents, service, service_reference_id, real_cost_cents, margin_cents)
       VALUES ($1, 'consumo', $2, $3, $4, $5, $6, $7)`,
      [clinicId, (-chargeCents).toString(), newBalance.toString(), service, referenceId, realCostCents, chargeCents - realCostCents]
    )

    await checkLowBalanceThresholds(clinicId, newBalance, BigInt(account.last_recharge_amount_cents), account, client)

    return Number(newBalance)
  }).then(newBalance => {
    // Fuera de la transacción a propósito: una llamada de red a Stripe no
    // debe mantener la fila bloqueada. Fire-and-forget — un fallo aquí no
    // debe hacer fallar la respuesta que ya se le dio al agente/paciente.
    maybeAutoRecharge(clinicId).catch(() => {})
    return newBalance
  })
}

// Registra una recarga (manual o automática) y resetea los avisos de saldo
// bajo para que puedan dispararse de nuevo en el siguiente ciclo de gasto.
export async function recordRecharge(params: {
  clinicId: string
  amountCents: number
  type: 'recarga' | 'recarga_automatica'
  stripePaymentId?: string | null
  createdBy?: string | null
}): Promise<number> {
  const { clinicId, amountCents, type, stripePaymentId, createdBy } = params
  if (!Number.isFinite(amountCents) || amountCents <= 0) throw new Error(`amountCents inválido: ${amountCents}`)

  return withTransaction(async client => {
    await getOrCreateAccount(clinicId)
    const { rows } = await client.query<CreditAccount>(
      'SELECT * FROM clinic_credit_accounts WHERE clinic_id = $1 FOR UPDATE', [clinicId]
    )
    const account = rows[0]
    const newBalance = BigInt(account.balance_cents) + BigInt(amountCents)

    await client.query(
      `UPDATE clinic_credit_accounts SET
         balance_cents = $1, last_recharge_amount_cents = $2, updated_at = NOW(),
         low_balance_20_notified_at = NULL, low_balance_10_notified_at = NULL, low_balance_5_notified_at = NULL
       WHERE clinic_id = $3`,
      [newBalance.toString(), amountCents, clinicId]
    )
    await client.query(
      `INSERT INTO credit_transactions
         (clinic_id, transaction_type, amount_cents, balance_after_cents, stripe_payment_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, type, amountCents, newBalance.toString(), stripePaymentId ?? null, createdBy ?? null]
    )
    return Number(newBalance)
  })
}

// Ajuste manual (superadmin) — positivo o negativo, siempre con motivo.
export async function manualAdjustment(clinicId: string, amountCents: number, notes: string, createdBy: string): Promise<number> {
  if (!Number.isInteger(amountCents) || amountCents === 0) throw new Error('amountCents debe ser un entero distinto de 0')
  if (!notes?.trim()) throw new Error('El motivo del ajuste es obligatorio')

  return withTransaction(async client => {
    await getOrCreateAccount(clinicId)
    const { rows } = await client.query<CreditAccount>(
      'SELECT * FROM clinic_credit_accounts WHERE clinic_id = $1 FOR UPDATE', [clinicId]
    )
    const account = rows[0]
    const newBalance = BigInt(account.balance_cents) + BigInt(amountCents)
    await client.query(
      'UPDATE clinic_credit_accounts SET balance_cents = $1, updated_at = NOW() WHERE clinic_id = $2',
      [newBalance.toString(), clinicId]
    )
    await client.query(
      `INSERT INTO credit_transactions (clinic_id, transaction_type, amount_cents, balance_after_cents, notes, created_by)
       VALUES ($1, 'ajuste_manual', $2, $3, $4, $5)`,
      [clinicId, amountCents, newBalance.toString(), notes.trim(), createdBy]
    )
    return Number(newBalance)
  })
}

// Cada umbral se notifica UNA SOLA VEZ por ciclo de saldo (se resetea al
// recargar, en recordRecharge). Se ejecuta DENTRO de la transacción de
// chargeCredit para que la marca de "ya notificado" sea parte de la misma
// operación atómica que descontó el saldo.
async function checkLowBalanceThresholds(
  clinicId: string, newBalance: bigint, baselineCents: bigint, account: CreditAccount, client: PoolClient
) {
  if (baselineCents <= 0n) return
  const pct = baselineCents > 0n ? (Number(newBalance) / Number(baselineCents)) * 100 : 0

  const fire = async (level: '20' | '10' | '5', column: string) => {
    await client.query(`UPDATE clinic_credit_accounts SET ${column} = NOW() WHERE clinic_id = $1`, [clinicId])
    // El envío del email no debe hacer fallar/revertir el cobro si falla —
    // se dispara tras el commit implícito de la marca, best-effort.
    notifyLowBalance(clinicId, level, newBalance).catch(err =>
      console.error(`[creditService] fallo notificando saldo bajo (${level}%) a clínica ${clinicId}:`, err.message)
    )
  }

  // Se comprueban los tres umbrales de forma independiente (no "el peor
  // gana") para que, si un cargo grande cruza varios umbrales de golpe, se
  // registren y notifiquen todos los que corresponda, no solo el más severo.
  if (pct <= 20 && !account.low_balance_20_notified_at) await fire('20', 'low_balance_20_notified_at')
  if (pct <= 10 && !account.low_balance_10_notified_at) await fire('10', 'low_balance_10_notified_at')
  if (pct <= 5 && !account.low_balance_5_notified_at) await fire('5', 'low_balance_5_notified_at')
  if (newBalance <= 0n) await notifyLowBalance(clinicId, '0', newBalance).catch(err =>
    console.error(`[creditService] fallo notificando saldo agotado a clínica ${clinicId}:`, err.message)
  )
}

// Se llama DESPUÉS de que chargeCredit() haya confirmado su transacción
// (nunca dentro del bloqueo de fila — una llamada de red a Stripe no debe
// mantener la fila bloqueada). Si la clínica tiene auto-recarga activada,
// hay método de pago guardado, y el saldo ha cruzado su umbral configurado,
// dispara un cobro off-session contra ese método y registra la recarga.
// Nunca lanza — un fallo aquí (p. ej. tarjeta rechazada) solo se registra;
// los avisos de saldo bajo del 10%/5% ya cubren ese caso con carácter crítico.
export async function maybeAutoRecharge(clinicId: string): Promise<void> {
  try {
    const account = await getOrCreateAccount(clinicId)
    if (!account.auto_recharge || !account.stripe_payment_method_id) return

    const baseline = BigInt(account.last_recharge_amount_cents)
    if (baseline <= 0n) return
    const pct = (Number(BigInt(account.balance_cents)) / Number(baseline)) * 100
    const thresholdPct = Number(account.auto_recharge_threshold_pct)
    if (pct > thresholdPct) return

    const { getClinicById, getOrCreateStripeCustomer } = await import('../routes/billing')
    const { getStripe } = await import('./stripe')
    const clinic = await getClinicById(clinicId)
    if (!clinic) return
    const customerId = await getOrCreateStripeCustomer(clinic)
    const amountCents = Number(account.auto_recharge_amount_cents)

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      customer: customerId,
      payment_method: account.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      metadata: { clinic_id: clinicId, type: 'ai_credit_auto_recharge' },
    })

    if (paymentIntent.status === 'succeeded') {
      await recordRecharge({ clinicId, amountCents, type: 'recarga_automatica', stripePaymentId: paymentIntent.id })
    } else {
      console.error(`[creditService] auto-recarga de clínica ${clinicId} no se confirmó (status=${paymentIntent.status})`)
    }
  } catch (err: any) {
    // Tarjeta rechazada u otro fallo de Stripe — la auto-recarga "no pudo
    // garantizarse", tal y como contempla el punto 5 del documento de
    // requisitos; los avisos de saldo bajo siguen su curso normal.
    console.error(`[creditService] fallo en auto-recarga de clínica ${clinicId}:`, err.message)
  }
}
