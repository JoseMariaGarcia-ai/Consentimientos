import { Router } from 'express'
import { queryOne, query } from '../lib/db'

const router = Router()

// GET /api/me — the authenticated user's own profile + module permissions.
// Unlike /api/users this is available to every role (not just admins), since
// each user needs to know their own access to render the sidebar correctly.
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const me = await queryOne<any>('SELECT id, email, full_name, role, clinic_id, lab_partner_id FROM app_users WHERE id = $1', [userId])
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' })
    const permissions = await query<{ module: string; can_access: boolean }>(
      'SELECT module, can_access FROM user_permissions WHERE user_id = $1', [userId]
    )
    return res.json({ ...me, user_permissions: permissions })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
