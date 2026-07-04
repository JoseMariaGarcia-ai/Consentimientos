import { Router } from 'express'
import crypto from 'crypto'
import { query, queryOne } from '../lib/db'
import { signToken } from '../lib/jwt'
import { sendMagicLink } from '../lib/mail'

const router = Router()

router.post('/magic-link', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requerido' })
  try {
    let user = await queryOne<{ id: string; email: string; clinic_id: string }>(
      'SELECT id, email, clinic_id FROM app_users WHERE email = $1', [email]
    )
    if (!user) {
      // Don't auto-create users — they must be invited by an admin first
      return res.status(404).json({ error: 'No tienes acceso. Solicita una invitación al administrador.' })
    }
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await query(
      'INSERT INTO magic_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    )
    const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
    await sendMagicLink(email, rawToken, appUrl)
    return res.json({ ok: true })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

router.get('/verify', async (req, res) => {
  const { token } = req.query as { token: string }
  if (!token) return res.status(400).json({ error: 'Token requerido' })
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const row = await queryOne<{ id: string; user_id: string; expires_at: Date; used_at: Date | null }>(
      'SELECT id, user_id, expires_at, used_at FROM magic_tokens WHERE token_hash = $1', [tokenHash]
    )
    if (!row) return res.status(400).json({ error: 'Token inválido' })
    if (row.used_at) return res.status(400).json({ error: 'Token ya usado' })
    if (new Date() > new Date(row.expires_at)) return res.status(400).json({ error: 'Token expirado' })
    await query('UPDATE magic_tokens SET used_at = NOW() WHERE id = $1', [row.id])
    await query('UPDATE app_users SET last_login = NOW() WHERE id = $1', [row.user_id])
    const user = await queryOne<{ id: string; email: string; clinic_id: string; role: string }>(
      'SELECT id, email, clinic_id, role FROM app_users WHERE id = $1', [row.user_id]
    )
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' })
    const jwtToken = signToken({ userId: user.id, email: user.email, clinicId: user.clinic_id, role: user.role })
    return res.json({ token: jwtToken, email: user.email, role: user.role })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
