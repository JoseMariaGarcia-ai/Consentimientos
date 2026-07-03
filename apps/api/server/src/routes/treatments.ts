import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

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
  const { name, duration_minutes, price } = req.body
  if (!name) return res.status(400).json({ error: 'El nombre del tratamiento es obligatorio' })
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const data = await queryOne(
      `INSERT INTO treatments (clinic_id, name, duration_minutes, price) VALUES ($1,$2,$3,$4) RETURNING *`,
      [clinicRow?.clinic_id, name, duration_minutes ?? 30, price ?? 0]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { name, duration_minutes, price } = req.body
  try {
    const data = await queryOne(
      `UPDATE treatments SET name=$1, duration_minutes=$2, price=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [name, duration_minutes ?? 30, price ?? 0, req.params.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM treatments WHERE id = $1', [req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
