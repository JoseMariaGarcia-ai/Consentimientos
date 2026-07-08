import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { query, queryOne } from '../lib/db'

// Tablets never carry a normal user JWT — they authenticate with a
// long-lived, clinic-scoped device token issued at pairing time (X-Device-Token
// header), checked here instead of the usual authMiddleware.
export async function deviceAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-device-token'] as string | undefined
  if (!token) return res.status(401).json({ error: 'Dispositivo no vinculado' })
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const device = await queryOne<{ id: string; clinic_id: string; name: string }>(
      'SELECT id, clinic_id, name FROM signing_devices WHERE device_token_hash = $1 AND revoked_at IS NULL',
      [tokenHash]
    )
    if (!device) return res.status(401).json({ error: 'Dispositivo no autorizado o revocado' })
    query('UPDATE signing_devices SET last_seen_at = NOW() WHERE id = $1', [device.id]).catch(() => {})
    ;(req as any).device = device
    next()
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
