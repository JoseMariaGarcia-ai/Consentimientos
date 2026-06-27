import { Router } from 'express'
import { queryOne } from '../lib/db'

const router = Router()

router.get('/', async (req, res) => {
  const { clinicId } = (req as any).user
  try {
    const data = await queryOne('SELECT * FROM clinics WHERE id = $1', [clinicId])
    return res.json(data ?? {})
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/', async (req, res) => {
  const { clinicId } = (req as any).user
  const { name, address, phone, email, tax_id, logo_url } = req.body
  try {
    const data = await queryOne(
      `UPDATE clinics SET name=$1, address=$2, phone=$3, email=$4, tax_id=$5, logo_url=$6 WHERE id=$7 RETURNING *`,
      [name, address, phone, email, tax_id, logo_url, clinicId]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
