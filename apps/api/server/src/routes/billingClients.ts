import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

async function getClinicId(userId: string): Promise<string | null> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  return row?.clinic_id ?? null
}

// GET /api/billing-clients?q=...&include_inactive=1
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { q, include_inactive } = req.query
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.json([])
    let sql = `
      SELECT bc.*,
        (SELECT COUNT(*) FROM invoices i WHERE i.billing_client_id = bc.id) AS invoice_count
      FROM billing_clients bc
      WHERE bc.clinic_id = $1
    `
    const params: any[] = [clinicId]
    if (!include_inactive) sql += ' AND bc.is_active = true'
    if (q) { params.push(`%${q}%`); sql += ` AND (bc.full_name ILIKE $${params.length} OR bc.tax_id ILIKE $${params.length})` }
    sql += ' ORDER BY bc.full_name ASC'
    const data = await query(sql, params)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const b = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const full_name = String(b.full_name ?? '').trim()
    const tax_id = String(b.tax_id ?? '').trim()
    const address = String(b.address ?? '').trim()
    if (!full_name) return res.status(400).json({ error: 'El nombre / razón social es obligatorio' })
    if (!tax_id) return res.status(400).json({ error: 'El NIF/CIF es obligatorio' })
    if (!address) return res.status(400).json({ error: 'La dirección es obligatoria' })

    const data = await queryOne(
      `INSERT INTO billing_clients (
         clinic_id, full_name, tax_id, address, postal_code, city, province, email, phone, notes, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        clinicId, full_name, tax_id, address,
        b.postal_code || null, b.city || null, b.province || null,
        b.email || null, b.phone || null, b.notes || null, userId,
      ]
    )
    return res.status(201).json({ ...data, invoice_count: 0 })
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const b = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const full_name = String(b.full_name ?? '').trim()
    const tax_id = String(b.tax_id ?? '').trim()
    const address = String(b.address ?? '').trim()
    if (!full_name) return res.status(400).json({ error: 'El nombre / razón social es obligatorio' })
    if (!tax_id) return res.status(400).json({ error: 'El NIF/CIF es obligatorio' })
    if (!address) return res.status(400).json({ error: 'La dirección es obligatoria' })

    const data = await queryOne(
      `UPDATE billing_clients SET
         full_name=$1, tax_id=$2, address=$3, postal_code=$4, city=$5, province=$6,
         email=$7, phone=$8, notes=$9, is_active=COALESCE($10, is_active), updated_at=NOW()
       WHERE id=$11 AND clinic_id=$12 RETURNING *`,
      [
        full_name, tax_id, address, b.postal_code || null, b.city || null, b.province || null,
        b.email || null, b.phone || null, b.notes || null,
        typeof b.is_active === 'boolean' ? b.is_active : null,
        req.params.id, clinicId,
      ]
    )
    if (!data) return res.status(404).json({ error: 'Cliente no encontrado' })
    return res.json(data)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// DELETE /api/billing-clients/:id — borra de verdad solo si nunca se le ha
// facturado; si tiene facturas asociadas, se marca inactivo en su lugar
// (mismo criterio de conservación que el resto del sistema).
router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const client = await queryOne<{ id: string }>(
      'SELECT id FROM billing_clients WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId]
    )
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })

    const countRow = await queryOne<{ count: string }>(
      'SELECT COUNT(*) FROM invoices WHERE billing_client_id = $1', [client.id]
    )
    const invoiceCount = Number(countRow?.count ?? 0)

    if (invoiceCount === 0) {
      await query('DELETE FROM billing_clients WHERE id = $1', [client.id])
      return res.json({ deleted: true })
    }
    const data = await queryOne(
      'UPDATE billing_clients SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [client.id]
    )
    return res.json({ deactivated: true, client: data })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
