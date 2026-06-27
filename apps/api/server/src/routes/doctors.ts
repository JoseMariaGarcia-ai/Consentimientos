import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const data = await query(
      `SELECT * FROM doctors WHERE clinic_id = (SELECT clinic_id FROM app_users WHERE id = $1) ORDER BY created_at DESC`,
      [userId]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const { name, specialty, license_number, email, role } = req.body
    const data = await queryOne(
      `INSERT INTO doctors (clinic_id, name, specialty, license_number, email, role) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [clinicRow?.clinic_id, name, specialty, license_number, email, role ?? 'doctor']
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { name, specialty, license_number, email, role } = req.body
  try {
    const data = await queryOne(
      `UPDATE doctors SET name=$1, specialty=$2, license_number=$3, email=$4, role=$5 WHERE id=$6 RETURNING *`,
      [name, specialty, license_number, email, role, req.params.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM doctors WHERE id = $1', [req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
