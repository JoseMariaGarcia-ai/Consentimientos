import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const ALL_MODULES = ['dashboard', 'agenda', 'patients', 'doctors', 'consents', 'clinical-records', 'photos', 'clinic', 'settings', 'templates', 'lab-partners', 'toxin', 'whatsapp']
const PLANS = ['base', 'pro', 'ia', 'ia-plus']
const router = Router()

async function canManageUser(requesterId: string, targetId: string): Promise<{ ok: boolean; requesterIsSuperAdmin: boolean; targetClinicId: string | null }> {
  const me = await queryOne<{ clinic_id: string; role: string }>('SELECT clinic_id, role FROM app_users WHERE id = $1', [requesterId])
  if (!me) return { ok: false, requesterIsSuperAdmin: false, targetClinicId: null }
  const target = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [targetId])
  if (me.role === 'superadmin') return { ok: true, requesterIsSuperAdmin: true, targetClinicId: target?.clinic_id ?? null }
  return { ok: !!target && target.clinic_id === me.clinic_id, requesterIsSuperAdmin: false, targetClinicId: target?.clinic_id ?? null }
}

// Reads plan_permissions for a plan, defaulting any module without an
// explicit row to false, so a "clinica" user's access always matches
// exactly what's configured in Configuración > Planes Suscripción.
async function getPlanPermissions(plan: string): Promise<Record<string, boolean>> {
  const perms = Object.fromEntries(ALL_MODULES.map(m => [m, false]))
  if (!PLANS.includes(plan)) return perms
  const rows = await query<{ module: string; can_access: boolean }>(
    'SELECT module, can_access FROM plan_permissions WHERE plan = $1', [plan]
  )
  for (const r of rows) perms[r.module] = r.can_access
  return perms
}

async function applyUserPermissions(userId: string, permissions: Record<string, boolean>) {
  for (const module of ALL_MODULES) {
    await query(
      `INSERT INTO user_permissions (user_id, module, can_access) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, module) DO UPDATE SET can_access=$3`,
      [userId, module, permissions[module] ?? false]
    )
  }
}

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
  const { email, full_name, role, lab_partner_id, permissions, plan } = req.body
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string; role: string }>('SELECT clinic_id, role FROM app_users WHERE id = $1', [userId])
    if (role === 'superadmin' && me?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo un superadmin puede crear otro superadmin' })
    }
    const clinic_id = me?.clinic_id ?? null
    const user = await queryOne<{ id: string }>(
      `INSERT INTO app_users (email, full_name, role, clinic_id, lab_partner_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [email, full_name, role ?? 'clinica', clinic_id, lab_partner_id ?? null]
    )

    if ((role ?? 'clinica') === 'clinica' && plan) {
      // Permissions for a "clinica" user are always derived from the
      // clinic's plan — never taken from a client-sent permissions object.
      await applyUserPermissions(user!.id, await getPlanPermissions(plan))
      if (clinic_id) await query('UPDATE clinics SET plan = $1 WHERE id = $2', [plan, clinic_id])
    } else {
      const perms = ALL_MODULES.map(m => [user!.id, m, permissions ? (permissions[m] ?? true) : true])
      for (const p of perms) {
        await query('INSERT INTO user_permissions (user_id, module, can_access) VALUES ($1,$2,$3)', p)
      }
    }
    return res.status(201).json(user)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const { full_name, role, is_active, lab_partner_id, plan } = req.body
  try {
    const { ok, requesterIsSuperAdmin, targetClinicId } = await canManageUser(userId, req.params.id)
    if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' })
    if (role === 'superadmin' && !requesterIsSuperAdmin) {
      return res.status(403).json({ error: 'Solo un superadmin puede asignar el rol superadmin' })
    }
    const data = await queryOne(
      `UPDATE app_users SET full_name=$1, role=$2, is_active=$3, lab_partner_id=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [full_name, role, is_active, lab_partner_id ?? null, req.params.id]
    )

    if (role === 'clinica' && plan) {
      await applyUserPermissions(req.params.id, await getPlanPermissions(plan))
      if (targetClinicId) await query('UPDATE clinics SET plan = $1 WHERE id = $2', [plan, targetClinicId])
    }
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id/permissions', async (req, res) => {
  const { userId } = (req as any).user
  const permissions: Record<string, boolean> = req.body
  try {
    const { ok } = await canManageUser(userId, req.params.id)
    if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' })
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
  const { userId } = (req as any).user
  try {
    const { ok } = await canManageUser(userId, req.params.id)
    if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' })
    await query('DELETE FROM user_permissions WHERE user_id = $1', [req.params.id])
    await query('DELETE FROM app_users WHERE id = $1', [req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
