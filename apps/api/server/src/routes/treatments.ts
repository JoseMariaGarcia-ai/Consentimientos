import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

// Misma paleta que apps/web/src/lib/treatmentColors.ts — se valida contra
// esta lista para que nunca se pueda guardar un color fuera de la paleta
// curada de tonos suaves, aunque se llame a la API directamente.
const TREATMENT_COLORS = ['blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'orange', 'pink']
function validColor(color: unknown): string {
  return typeof color === 'string' && TREATMENT_COLORS.includes(color) ? color : 'blue'
}

router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const data = await query(
      `SELECT * FROM treatments WHERE clinic_id = (SELECT clinic_id FROM app_users WHERE id = $1) ORDER BY name ASC`,
      [userId]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const { name, duration_minutes, price, color } = req.body
  if (!name) return res.status(400).json({ error: 'El nombre del tratamiento es obligatorio' })
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const data = await queryOne(
      `INSERT INTO treatments (clinic_id, name, duration_minutes, price, color) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [clinicRow?.clinic_id, name, duration_minutes ?? 30, price ?? 0, validColor(color)]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const { name, duration_minutes, price, color } = req.body
  try {
    const data = await queryOne(
      `UPDATE treatments SET name=$1, duration_minutes=$2, price=$3, color=$4, updated_at=NOW()
       WHERE id=$5 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $6) RETURNING *`,
      [name, duration_minutes ?? 30, price ?? 0, validColor(color), req.params.id, userId]
    )
    if (!data) return res.status(404).json({ error: 'Tratamiento no encontrado' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const data = await queryOne(
      'DELETE FROM treatments WHERE id = $1 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2) RETURNING id',
      [req.params.id, userId]
    )
    if (!data) return res.status(404).json({ error: 'Tratamiento no encontrado' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
