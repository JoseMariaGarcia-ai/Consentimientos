import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { getOrCreateAccount, manualAdjustment } from '../lib/creditService'
import { getStripe } from '../lib/stripe'

const router = Router()
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
const RECHARGE_PRESETS_CENTS = [5000, 10000, 20000] // 50€, 100€, 200€

async function getClinicId(userId: string): Promise<string | null> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  return row?.clinic_id ?? null
}

function pctRemaining(balanceCents: string, baselineCents: string): number {
  const baseline = Number(baselineCents)
  if (baseline <= 0) return 0
  return Math.max(0, Math.round((Number(balanceCents) / baseline) * 1000) / 10)
}

// GET /api/ai-credits/balance
router.get('/balance', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const account = await getOrCreateAccount(clinicId)
    return res.json({
      balanceCents: Number(account.balance_cents),
      lastRechargeAmountCents: Number(account.last_recharge_amount_cents),
      pctRemaining: pctRemaining(account.balance_cents, account.last_recharge_amount_cents),
      autoRecharge: account.auto_recharge,
      autoRechargeAmountCents: Number(account.auto_recharge_amount_cents),
      autoRechargeThresholdPct: Number(account.auto_recharge_threshold_pct),
      hasPaymentMethod: !!account.stripe_payment_method_id,
    })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/ai-credits/transactions?service=&date_from=&date_to=
router.get('/transactions', async (req, res) => {
  const { userId } = (req as any).user
  const { service, date_from, date_to } = req.query
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    await getOrCreateAccount(clinicId)

    let sql = 'SELECT * FROM credit_transactions WHERE clinic_id = $1'
    const params: any[] = [clinicId]
    if (service) { params.push(service); sql += ` AND service = $${params.length}` }
    if (date_from) { params.push(date_from); sql += ` AND created_at >= $${params.length}` }
    if (date_to) { params.push(date_to); sql += ` AND created_at < $${params.length}::date + INTERVAL '1 day'` }
    sql += ' ORDER BY created_at DESC LIMIT 500'

    return res.json(await query(sql, params))
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/ai-credits/recharge { amountCents }
router.post('/recharge', async (req, res) => {
  const { userId } = (req as any).user
  const { amountCents } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const amount = Number(amountCents)
    if (!Number.isInteger(amount) || amount < 500) {
      return res.status(400).json({ error: 'Importe no válido (mínimo 5,00 €)' })
    }
    await getOrCreateAccount(clinicId)
    const { getOrCreateStripeCustomer, getClinicById } = await import('./billing')
    const clinic = await getClinicById(clinicId)
    if (!clinic) return res.status(404).json({ error: 'Clínica no encontrada' })
    const customerId = await getOrCreateStripeCustomer(clinic)

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Recarga de saldo IA — ConsentsPro' },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      metadata: { clinic_id: clinicId, type: 'ai_credit_recharge' },
      success_url: `${APP_URL}/ai-credits?checkout=success`,
      cancel_url: `${APP_URL}/ai-credits?checkout=cancelled`,
    })
    return res.json({ url: session.url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/ai-credits/setup-intent — guarda un método de pago (sin cobro
// inmediato) para poder usarlo luego en la auto-recarga.
router.post('/setup-intent', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    await getOrCreateAccount(clinicId)
    const { getOrCreateStripeCustomer, getClinicById } = await import('./billing')
    const clinic = await getClinicById(clinicId)
    if (!clinic) return res.status(404).json({ error: 'Clínica no encontrada' })
    const customerId = await getOrCreateStripeCustomer(clinic)

    const session = await getStripe().checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      metadata: { clinic_id: clinicId, type: 'ai_credit_setup' },
      success_url: `${APP_URL}/ai-credits?checkout=success`,
      cancel_url: `${APP_URL}/ai-credits?checkout=cancelled`,
    })
    return res.json({ url: session.url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// PUT /api/ai-credits/auto-recharge { enabled, amountCents, thresholdPct }
router.put('/auto-recharge', async (req, res) => {
  const { userId } = (req as any).user
  const { enabled, amountCents, thresholdPct } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const account = await getOrCreateAccount(clinicId)

    if (enabled && !account.stripe_payment_method_id) {
      return res.status(400).json({ error: 'Añade un método de pago antes de activar la recarga automática' })
    }
    const amount = amountCents != null ? Number(amountCents) : Number(account.auto_recharge_amount_cents)
    const threshold = thresholdPct != null ? Number(thresholdPct) : Number(account.auto_recharge_threshold_pct)
    if (!Number.isInteger(amount) || amount < 500) return res.status(400).json({ error: 'Importe de recarga no válido' })
    if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 90) return res.status(400).json({ error: 'Umbral no válido' })

    const updated = await queryOne(
      `UPDATE clinic_credit_accounts SET
         auto_recharge = $1, auto_recharge_amount_cents = $2, auto_recharge_threshold_pct = $3, updated_at = NOW()
       WHERE clinic_id = $4 RETURNING *`,
      [!!enabled, amount, threshold, clinicId]
    )
    return res.json(updated)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/ai-credits/presets — importes predefinidos de recarga (para no
// hardcodear en el frontend valores que puedan cambiar).
router.get('/presets', (_req, res) => res.json({ presets: RECHARGE_PRESETS_CENTS }))

// POST /api/ai-credits/adjust — ajuste manual (solo admin/superadmin de la
// propia clínica; el ajuste multi-clínica del superadmin vive en aiRevenue.ts)
router.post('/adjust', async (req, res) => {
  const { userId } = (req as any).user
  const { amountCents, notes } = req.body
  try {
    // El rol se relee de la BD (no del claim del JWT, que puede llevar hasta
    // 30 días desactualizado tras un cambio de rol) — mismo criterio que
    // requireAdmin/requireSuperAdmin en middleware/auth.ts.
    const me = await queryOne<{ clinic_id: string; role: string }>('SELECT clinic_id, role FROM app_users WHERE id = $1', [userId])
    if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) return res.status(403).json({ error: 'Solo administradores' })
    if (!me.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const newBalance = await manualAdjustment(me.clinic_id, Number(amountCents), notes, userId)
    return res.json({ balanceCents: newBalance })
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

export default router
