import crypto from 'crypto'
import { query } from './db'

// Genera un enlace de acceso de un solo uso al portal del paciente,
// reutilizando el mismo mecanismo de magic_tokens que ya usan
// patientWelcomeEmail.ts e inviteEmail.ts — así "Ir a mi portal" entra
// directamente en cuanto se pulsa, en vez de aterrizar en la pantalla de
// login (pensada para el personal de la clínica) sin sesión iniciada.
export async function buildPatientPortalLink(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

  await query(
    'INSERT INTO magic_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  )

  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  return `${appUrl}/auth/verify?token=${rawToken}`
}
