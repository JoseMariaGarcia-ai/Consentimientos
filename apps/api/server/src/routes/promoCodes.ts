import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { isValidPlan } from '../lib/plans'

// Montado en index.ts detrás de authMiddleware + requireSuperAdmin — solo
// el equipo de ConsentsPro gestiona los códigos de campaña.
const router = Router()

router.get('/', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM promo_codes ORDER BY created_at DESC')
    return res.json(rows)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const { code, plan_id, trial_days, campaign_name, max_uses, expires_at } = req.body
  if (!code || !plan_id) return res.status(400).json({ error: 'code y plan_id son obligatorios' })
  if (!isValidPlan(plan_id)) return res.status(400).json({ error: 'Plan no válido' })
  try {
    const row = await queryOne(
      `INSERT INTO promo_codes (code, plan_id, trial_days, campaign_name, max_uses, expires_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        String(code).trim().toUpperCase(),
        plan_id,
        Number(trial_days) || 10,
        campaign_name ?? null,
        max_uses ? Number(max_uses) : null,
        expires_at || null,
        userId,
      ]
    )
    return res.status(201).json(row)
  } catch (err: any) {
    if (String(err.message).includes('duplicate key')) return res.status(409).json({ error: 'Ese código ya existe' })
    return res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { plan_id, trial_days, campaign_name, max_uses, expires_at, is_active } = req.body
  if (plan_id && !isValidPlan(plan_id)) return res.status(400).json({ error: 'Plan no válido' })
  try {
    const row = await queryOne(
      `UPDATE promo_codes SET plan_id=$1, trial_days=$2, campaign_name=$3, max_uses=$4, expires_at=$5, is_active=$6
       WHERE id=$7 RETURNING *`,
      [
        plan_id,
        Number(trial_days) || 10,
        campaign_name ?? null,
        max_uses ? Number(max_uses) : null,
        expires_at || null,
        is_active ?? true,
        req.params.id,
      ]
    )
    if (!row) return res.status(404).json({ error: 'Código no encontrado' })
    return res.json(row)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM promo_codes WHERE id = $1', [req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
