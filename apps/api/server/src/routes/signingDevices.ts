import { Router } from 'express'
import crypto from 'crypto'
import { query, queryOne } from '../lib/db'

// Public router: only the pairing endpoint, called by a tablet that has no
// session of its own yet.
const publicRouter = Router()

// POST /api/signing-devices/pair — the tablet sends the code it scanned (QR
// or manually) and gets back a long-lived device token in exchange. No auth
// required: the short-lived, single-use pairing code IS the credential here.
publicRouter.post('/pair', async (req, res) => {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'code requerido' })
  try {
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')
    const pairing = await queryOne<{ id: string; clinic_id: string; device_name: string; expires_at: string; used_at: string | null }>(
      'SELECT id, clinic_id, device_name, expires_at, used_at FROM signing_device_pairing_codes WHERE code_hash = $1',
      [codeHash]
    )
    if (!pairing) return res.status(400).json({ error: 'Código no válido' })
    if (pairing.used_at) return res.status(400).json({ error: 'Este código ya se ha usado' })
    if (new Date() > new Date(pairing.expires_at)) return res.status(400).json({ error: 'Código caducado, genera uno nuevo' })

    await query('UPDATE signing_device_pairing_codes SET used_at = NOW() WHERE id = $1', [pairing.id])

    const deviceToken = crypto.randomBytes(32).toString('hex')
    const deviceTokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex')
    await query(
      'INSERT INTO signing_devices (clinic_id, name, device_token_hash) VALUES ($1,$2,$3)',
      [pairing.clinic_id, pairing.device_name, deviceTokenHash]
    )

    const clinic = await queryOne<{ name: string; trade_name: string | null }>(
      'SELECT name, trade_name FROM clinics WHERE id = $1', [pairing.clinic_id]
    )

    return res.json({ deviceToken, clinicName: clinic?.trade_name ?? clinic?.name ?? 'Tu clínica' })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Protected router: managing devices is clinic-config, gated by requireAdmin
// (admin/superadmin) same as the rest of Configuración.
const router = Router()

router.post('/pairing-code', async (req, res) => {
  const { userId } = (req as any).user
  const { device_name } = req.body
  try {
    const me = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })

    const rawCode = crypto.randomBytes(24).toString('hex')
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await query(
      'INSERT INTO signing_device_pairing_codes (clinic_id, device_name, code_hash, created_by, expires_at) VALUES ($1,$2,$3,$4,$5)',
      [me.clinic_id, device_name || 'Tablet de firma', codeHash, userId, expiresAt]
    )

    const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
    return res.status(201).json({
      code: rawCode,
      pairUrl: `${appUrl}/tablet-pair?code=${rawCode}`,
      expires_at: expiresAt.toISOString(),
    })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const me = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const data = await query(
      `SELECT id, name, created_at, last_seen_at, revoked_at FROM signing_devices
       WHERE clinic_id = $1 ORDER BY created_at DESC`,
      [me.clinic_id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const me = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const data = await queryOne(
      'UPDATE signing_devices SET revoked_at = NOW() WHERE id = $1 AND clinic_id = $2 RETURNING id',
      [req.params.id, me.clinic_id]
    )
    if (!data) return res.status(404).json({ error: 'Dispositivo no encontrado' })
    return res.json({ revoked: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export { publicRouter }
export default router
