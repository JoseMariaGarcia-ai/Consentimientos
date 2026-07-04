import { Router } from 'express'
import { query, queryOne } from '../lib/db'

// TEMPORARY diagnostic endpoint — no auth, gated by a one-off secret.
// Read-only. Remove after use.
const router = Router()
const DIAG_SECRET = 'diag-7f3a9c2e-users-check'

router.get('/', async (req, res) => {
  if (req.query.key !== DIAG_SECRET) return res.status(404).end()
  try {
    const totalUsers = await queryOne<{ count: string }>('SELECT COUNT(*)::text FROM app_users')
    const me = await queryOne(
      `SELECT id, email, role, clinic_id, is_active, invited_at, last_login FROM app_users WHERE email = $1`,
      ['jmgarcialojo@icloud.com']
    )
    const allUsers = await query(
      `SELECT u.id, u.email, u.role, u.clinic_id, u.is_active
       FROM app_users u
       ORDER BY u.created_at DESC`
    )
    return res.json({
      totalUsersCount: totalUsers?.count,
      jmgarcialojo: me,
      allUsersCount: allUsers.length,
      allUsers,
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
