import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { sendBudgetEmail } from '../lib/budgetEmail'

const router = Router()

async function getClinicId(userId: string): Promise<string | null> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  return row?.clinic_id ?? null
}

async function belongsToClinic(table: string, id: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1 AND clinic_id = $2`, [id, clinicId])
  return !!row
}

async function nextBudgetNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear()
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) FROM budgets WHERE clinic_id = $1 AND budget_number LIKE $2`,
    [clinicId, `PRE-${year}-%`]
  )
  const seq = Number(rows[0]?.count ?? 0) + 1
  return `PRE-${year}-${String(seq).padStart(4, '0')}`
}

async function loadItems(budgetId: string) {
  return query(`SELECT * FROM budget_items WHERE budget_id = $1 ORDER BY sort_order ASC`, [budgetId])
}

function validateItems(items: any): { treatment_id: string | null; treatment_name: string; price: number }[] {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Debe incluir al menos un tratamiento')
  return items.map((it: any) => {
    const treatment_name = String(it.treatment_name ?? '').trim()
    if (!treatment_name) throw new Error('Cada tratamiento debe tener un nombre')
    return { treatment_id: it.treatment_id ?? null, treatment_name, price: Number(it.price) || 0 }
  })
}

// GET /api/budgets?date_from=&date_to=&patient_id=&q=
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { date_from, date_to, patient_id, q } = req.query
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.json([])

    let sql = `
      SELECT b.*, row_to_json(p) AS patient,
        (SELECT COALESCE(SUM(price), 0) FROM budget_items WHERE budget_id = b.id) AS total
      FROM budgets b
      LEFT JOIN patients p ON p.id = b.patient_id
      WHERE b.clinic_id = $1
    `
    const params: any[] = [clinicId]
    if (date_from)  { params.push(date_from);        sql += ` AND b.created_at >= $${params.length}` }
    if (date_to)    { params.push(date_to);           sql += ` AND b.created_at < $${params.length}::date + INTERVAL '1 day'` }
    if (patient_id) { params.push(patient_id);        sql += ` AND b.patient_id = $${params.length}` }
    if (q)          { params.push(`%${q}%`);          sql += ` AND (p.full_name ILIKE $${params.length} OR b.budget_number ILIKE $${params.length})` }
    sql += ' ORDER BY b.created_at DESC'

    const data = await query(sql, params)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const data = await queryOne<any>(
      `SELECT b.*, row_to_json(p) AS patient
       FROM budgets b
       LEFT JOIN patients p ON p.id = b.patient_id
       WHERE b.id = $1 AND b.clinic_id = $2`,
      [req.params.id, clinicId]
    )
    if (!data) return res.status(404).json({ error: 'Presupuesto no encontrado' })
    data.items = await loadItems(data.id)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id, items, notes, valid_until } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    if (patient_id && !(await belongsToClinic('patients', patient_id, clinicId))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    const validatedItems = validateItems(items)
    const budgetNumber = await nextBudgetNumber(clinicId)

    const budget = await queryOne<any>(
      `INSERT INTO budgets (clinic_id, patient_id, budget_number, notes, valid_until, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [clinicId, patient_id ?? null, budgetNumber, notes ?? null, valid_until || null, userId]
    )
    for (let i = 0; i < validatedItems.length; i++) {
      const it = validatedItems[i]
      await query(
        `INSERT INTO budget_items (budget_id, treatment_id, treatment_name, price, sort_order) VALUES ($1,$2,$3,$4,$5)`,
        [budget!.id, it.treatment_id, it.treatment_name, it.price, i]
      )
    }
    budget!.items = await loadItems(budget!.id)
    return res.status(201).json(budget)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id, items, notes, valid_until } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    if (!(await belongsToClinic('budgets', req.params.id, clinicId))) return res.status(404).json({ error: 'Presupuesto no encontrado' })
    if (patient_id && !(await belongsToClinic('patients', patient_id, clinicId))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    const validatedItems = validateItems(items)

    const budget = await queryOne<any>(
      `UPDATE budgets SET patient_id=$1, notes=$2, valid_until=$3, updated_at=NOW()
       WHERE id=$4 AND clinic_id=$5 RETURNING *`,
      [patient_id ?? null, notes ?? null, valid_until || null, req.params.id, clinicId]
    )
    await query(`DELETE FROM budget_items WHERE budget_id = $1`, [req.params.id])
    for (let i = 0; i < validatedItems.length; i++) {
      const it = validatedItems[i]
      await query(
        `INSERT INTO budget_items (budget_id, treatment_id, treatment_name, price, sort_order) VALUES ($1,$2,$3,$4,$5)`,
        [req.params.id, it.treatment_id, it.treatment_name, it.price, i]
      )
    }
    budget!.items = await loadItems(req.params.id)
    return res.json(budget)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const data = await queryOne('DELETE FROM budgets WHERE id = $1 AND clinic_id = $2 RETURNING id', [req.params.id, clinicId])
    if (!data) return res.status(404).json({ error: 'Presupuesto no encontrado' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/budgets/:id/send-email — { pdfBase64 } generated client-side
router.post('/:id/send-email', async (req, res) => {
  const { userId } = (req as any).user
  const { pdfBase64 } = req.body
  if (!pdfBase64) return res.status(400).json({ error: 'pdfBase64 requerido' })
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId || !(await belongsToClinic('budgets', req.params.id, clinicId))) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }
    const buffer = Buffer.from(pdfBase64, 'base64')
    const sent = await sendBudgetEmail({ budgetId: req.params.id, clinicId, pdfBuffer: buffer })
    if (!sent) return res.status(400).json({ error: 'El paciente no tiene email registrado' })
    return res.json({ sent: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
