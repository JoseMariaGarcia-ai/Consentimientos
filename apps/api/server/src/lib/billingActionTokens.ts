import crypto from 'crypto'
import { queryOne, query } from './db'

export type BillingAction = 'cancel' | 'portal' | 'reactivate'

const TOKEN_TTL_DAYS = 30

function hash(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

// Emite un token nuevo en cada llamada (solo se guarda su hash, así que no
// hay forma de recuperar uno anterior en claro para reutilizarlo). Los
// tokens previos de la misma suscripción+acción no se invalidan: siguen
// siendo válidos hasta su propio expires_at, así que un enlace de un email
// anterior no deja de funcionar solo porque se haya mandado uno nuevo.
export async function getOrCreateActionToken(subscriptionId: string, clinicId: string, action: BillingAction): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hash(rawToken)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  await query(
    `INSERT INTO billing_action_tokens (token_hash, subscription_id, clinic_id, action, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [tokenHash, subscriptionId, clinicId, action, expiresAt]
  )
  return rawToken
}

export async function resolveActionToken(rawToken: string, action: BillingAction) {
  const tokenHash = hash(rawToken)
  return queryOne<{ subscription_id: string; clinic_id: string; expires_at: string }>(
    `SELECT subscription_id, clinic_id, expires_at FROM billing_action_tokens
     WHERE token_hash = $1 AND action = $2 AND expires_at > NOW()`,
    [tokenHash, action]
  )
}
