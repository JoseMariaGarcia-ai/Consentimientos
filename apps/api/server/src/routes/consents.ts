import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { deductCredit } from '../lib/credits'

const router = Router()

router.get('/templates', async (_req, res) => {
  try {
    const data = await query(
      `SELECT id, treatment_type AS "treatmentType", content_json AS "contentJson", legal_clauses_json AS "legalClausesJson"
       FROM consent_templates WHERE is_active = true ORDER BY treatment_type ASC`
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.get('/', async (_req, res) => {
  try {
    const data = await query(
      `SELECT cr.*, row_to_json(p) AS patient, row_to_json(d) AS doctor, row_to_json(t) AS template
       FROM consent_records cr
       LEFT JOIN patients p ON p.id = cr.patient_id
       LEFT JOIN doctors d ON d.id = cr.doctor_id
       LEFT JOIN consent_templates t ON t.id = cr.template_id
       ORDER BY cr.created_at DESC`
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  try {
    const b = req.body
    const { userId } = (req as any).user
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    await deductCredit(clinicRow!.clinic_id, 'consents_available')
    const data = await queryOne(
      `INSERT INTO consent_records (patient_id, doctor_id, template_id, language, jurisdiction, status, sede)
       VALUES ($1,$2,$3,$4,$5,'pending',$6) RETURNING *`,
      [
        b.patient_id ?? b.patientId,
        b.doctor_id  ?? b.doctorId,
        b.template_id ?? b.templateId,
        b.language ?? 'es-ES',
        b.jurisdiction ?? null,
        b.sede ?? null,
      ]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status((err as any).status ?? 500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM consent_records WHERE id = $1', [req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
