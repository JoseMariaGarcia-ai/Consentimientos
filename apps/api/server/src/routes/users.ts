import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const ALL_MODULES = ['dashboard', 'patients', 'doctors', 'consents', 'clinical-records', 'photos', 'clinic', 'settings', 'templates', 'lab-partners']
const router = Router()

router.get('/', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string; role: string }>('SELECT clinic_id, role FROM app_users WHERE id = $1', [userId])
    if (!me) return res.json([])
    const isSuperAdmin = me.role === 'superadmin'
    const users = isSuperAdmin
      ? await query(
          `SELECT u.*, json_agg(json_build_object('module', p.module, 'can_access', p.can_access)) AS user_permissions
           FROM app_users u LEFT JOIN user_permissions p ON p.user_id = u.id
           GROUP BY u.id ORDER BY u.created_at DESC`
        )
      : await query(
          `SELECT u.*, json_agg(json_build_object('module', p.module, 'can_access', p.can_access)) AS user_permissions
           FROM app_users u LEFT JOIN user_permissions p ON p.user_id = u.id
           WHERE u.clinic_id = $1
           GROUP BY u.id ORDER BY u.created_at DESC`,
          [me.clinic_id]
        )
    return res.json(users)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { email, full_name, role, lab_partner_id, permissions } = req.body
  try {
    const { userId } = (req as any).user
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinic_id = clinicRow?.clinic_id ?? null
    const user = await queryOne<{ id: string }>(
      `INSERT INTO app_users (email, full_name, role, clinic_id, lab_partner_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [email, full_name, role ?? 'clinica', clinic_id, lab_partner_id ?? null]
    )
    const perms = ALL_MODULES.map(m => [user!.id, m, permissions ? (permissions[m] ?? true) : true])
    for (const p of perms) {
      await query('INSERT INTO user_permissions (user_id, module, can_access) VALUES ($1,$2,$3)', p)
    }
    return res.status(201).json(user)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { full_name, role, is_active, lab_partner_id } = req.body
  try {
    const data = await queryOne(
      `UPDATE app_users SET full_name=$1, role=$2, is_active=$3, lab_partner_id=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [full_name, role, is_active, lab_partner_id ?? null, req.params.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id/permissions', async (req, res) => {
  const permissions: Record<string, boolean> = req.body
  try {
    for (const [module, can_access] of Object.entries(permissions)) {
      await query(
        `INSERT INTO user_permissions (user_id, module, can_access) VALUES ($1,$2,$3)
         ON CONFLICT (user_id, module) DO UPDATE SET can_access=$3`,
        [req.params.id, module, can_access]
      )
    }
    return res.json({ updated: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM user_permissions WHERE user_id = $1', [req.params.id])
    await query('DELETE FROM app_users WHERE id = $1', [req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
