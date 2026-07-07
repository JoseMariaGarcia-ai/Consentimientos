import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const PLANS = ['base', 'pro', 'ia', 'ia-plus']
const ALL_MODULES = ['dashboard', 'agenda', 'patients', 'doctors', 'consents', 'clinical-records', 'photos', 'clinic', 'settings', 'templates', 'lab-partners', 'toxin', 'whatsapp']

const router = Router()

// GET /api/plan-permissions — full matrix { [plan]: { [module]: boolean } },
// filling in false for any module that has no explicit row yet (e.g. a
// module added after the plan's row was last saved).
router.get('/', async (_req, res) => {
  try {
    const rows = await query<{ plan: string; module: string; can_access: boolean }>(
      'SELECT plan, module, can_access FROM plan_permissions'
    )
    const byPlan: Record<string, Record<string, boolean>> = {}
    for (const plan of PLANS) byPlan[plan] = Object.fromEntries(ALL_MODULES.map(m => [m, false]))
    for (const r of rows) if (byPlan[r.plan]) byPlan[r.plan][r.module] = r.can_access
    return res.json(byPlan)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// PUT /api/plan-permissions/:plan — superadmin only, since this affects
// every clinic on that plan across the whole system.
router.put('/:plan', async (req, res) => {
  const { userId } = (req as any).user
  const plan = req.params.plan
  if (!PLANS.includes(plan)) return res.status(400).json({ error: 'Plan no válido' })
  try {
    const me = await queryOne<{ role: string }>('SELECT role FROM app_users WHERE id = $1', [userId])
    if (me?.role !== 'superadmin') return res.status(403).json({ error: 'Solo un superadmin puede gestionar los planes' })

    const permissions: Record<string, boolean> = req.body.permissions ?? {}
    for (const [module, can_access] of Object.entries(permissions)) {
      await query(
        `INSERT INTO plan_permissions (plan, module, can_access) VALUES ($1,$2,$3)
         ON CONFLICT (plan, module) DO UPDATE SET can_access=$3`,
        [plan, module, can_access]
      )
    }
    return res.json({ updated: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
