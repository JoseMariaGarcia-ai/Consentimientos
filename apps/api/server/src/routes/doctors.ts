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
    const b = req.body
    const license_number = b.license_number ?? b.licenseNumber ?? null
    const { name, specialty, email, phone, role } = b
    const data = await queryOne(
      `INSERT INTO doctors (clinic_id, name, specialty, license_number, phone, email, role) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [clinicRow?.clinic_id, name, specialty, license_number, phone ?? null, email, role ?? 'doctor']
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const b = req.body
  const license_number = b.license_number ?? b.licenseNumber ?? null
  const { name, specialty, email, phone, role } = b
  try {
    const data = await queryOne(
      `UPDATE doctors SET name=$1, specialty=$2, license_number=$3, phone=$4, email=$5, role=$6
       WHERE id=$7 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $8) RETURNING *`,
      [name, specialty, license_number, phone ?? null, email, role, req.params.id, userId]
    )
    if (!data) return res.status(404).json({ error: 'Doctor no encontrado' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const data = await queryOne(
      'DELETE FROM doctors WHERE id = $1 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2) RETURNING id',
      [req.params.id, userId]
    )
    if (!data) return res.status(404).json({ error: 'Doctor no encontrado' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
