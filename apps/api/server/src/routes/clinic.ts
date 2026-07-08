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
  const { name, address, phone, email, tax_id, taxId, logo_url, legal_name, legalName, trade_name, tradeName, nika_number, nikaNumber, branches, directions_url, directionsUrl } = req.body
  try {
    const data = await queryOne(
      `UPDATE clinics SET name=$1, address=$2, phone=$3, email=$4, tax_id=$5, logo_url=$6, legal_name=$7, trade_name=$8, nika_number=$9, branches=$10, directions_url=$11 WHERE id=$12 RETURNING *`,
      [name, address, phone, email, tax_id ?? taxId, logo_url, legal_name ?? legalName ?? null, trade_name ?? tradeName ?? null, nika_number ?? nikaNumber ?? null, JSON.stringify(branches ?? []), directions_url ?? directionsUrl ?? null, clinicId]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
