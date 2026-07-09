import { query, queryOne } from './db'

export interface PromoCodeValidation {
  code: string
  planId: string
  trialDays: number
}

// Comprueba que el código existe, está activo, no ha caducado y no ha
// agotado su límite de usos. El planId que devuelve es el que manda —
// el checkout público lo usa para sobreescribir el plan que pidiera el
// cliente, igual que el precio nunca se fía de lo que mande el navegador.
export async function validatePromoCode(rawCode: string): Promise<PromoCodeValidation | null> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return null
  const row = await queryOne<{
    code: string; plan_id: string; trial_days: number
    max_uses: number | null; used_count: number; expires_at: string | null; is_active: boolean
  }>(
    'SELECT code, plan_id, trial_days, max_uses, used_count, expires_at, is_active FROM promo_codes WHERE upper(code) = $1',
    [code]
  )
  if (!row || !row.is_active) return null
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null
  if (row.max_uses != null && row.used_count >= row.max_uses) return null
  return { code: row.code, planId: row.plan_id, trialDays: row.trial_days }
}

// Marca un uso — se llama solo cuando la suscripción de prueba se crea de
// verdad (customer.subscription.created), nunca al solo abrir el checkout,
// para no contar intentos abandonados.
//
// Un mismo código sirve para muchos usuarios distintos, pero cada email
// solo puede canjearlo una vez — lo hace cumplir la restricción UNIQUE de
// promo_code_redemptions (atómico, no una comprobación previa que podría
// perder una carrera). Devuelve false si ese email ya lo había usado antes;
// el llamante debe entonces anular la suscripción de prueba recién creada,
// no aplicar el plan.
export async function redeemPromoCode(code: string, email: string, clinicId: string | null): Promise<boolean> {
  const promo = await queryOne<{ id: string }>('SELECT id FROM promo_codes WHERE upper(code) = upper($1)', [code])
  if (!promo) return false
  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO promo_code_redemptions (promo_code_id, email, clinic_id) VALUES ($1, $2, $3)
     ON CONFLICT (promo_code_id, email) DO NOTHING RETURNING id`,
    [promo.id, email.toLowerCase(), clinicId]
  )
  if (!inserted) return false
  await query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1', [promo.id])
  return true
}
