import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { deductCredit } from '../lib/credits'

const router = Router()

// Tri-estado: true/false explícitos, o null si no se ha preguntado/consta.
function triBool(v: unknown): boolean | null {
  return v === true || v === false ? v : null
}

router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patientId } = req.query
  try {
    const base = `
      SELECT cr.*, row_to_json(p) AS patient, row_to_json(d) AS doctor
      FROM clinical_records cr
      LEFT JOIN patients p ON p.id = cr.patient_id
      LEFT JOIN doctors d ON d.id = cr.doctor_id
      WHERE cr.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $1)
    `
    const data = patientId
      ? await query(base + ` AND cr.patient_id = $2 ORDER BY cr.date DESC`, [userId, patientId])
      : await query(base + ` ORDER BY cr.date DESC`, [userId])
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const b = req.body
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    await deductCredit(clinicRow!.clinic_id, 'clinical_records_available')
    const data = await queryOne(
      `INSERT INTO clinical_records
        (clinic_id, patient_id, doctor_id, date, reason_for_visit, anamnesis, current_medications, allergies, physical_exam, diagnosis, treatment_plan, notes, is_pregnant, tobacco_use, alcohol_use, drug_use)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        clinicRow?.clinic_id,
        b.patient_id ?? b.patientId,
        b.doctor_id  ?? b.doctorId  ?? null,
        b.date ?? new Date().toISOString().split('T')[0],
        b.reason_for_visit ?? b.reasonForVisit ?? null,
        b.anamnesis ?? null,
        b.current_medications ?? b.currentMedications ?? null,
        b.allergies ?? null,
        b.physical_exam ?? b.physicalExam ?? null,
        b.diagnosis ?? null,
        b.treatment_plan ?? b.treatmentPlan ?? null,
        b.notes ?? null,
        triBool(b.is_pregnant),
        triBool(b.tobacco_use),
        triBool(b.alcohol_use),
        triBool(b.drug_use),
      ]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status((err as any).status ?? 500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const b = req.body
  try {
    const data = await queryOne(
      `UPDATE clinical_records SET
        patient_id=$1, doctor_id=$2, date=$3, reason_for_visit=$4, anamnesis=$5,
        current_medications=$6, allergies=$7, physical_exam=$8, diagnosis=$9,
        treatment_plan=$10, notes=$11, is_pregnant=$12, tobacco_use=$13,
        alcohol_use=$14, drug_use=$15, updated_at=NOW()
       WHERE id=$16 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $17) RETURNING *`,
      [
        b.patient_id ?? b.patientId,
        b.doctor_id  ?? b.doctorId  ?? null,
        b.date,
        b.reason_for_visit ?? b.reasonForVisit ?? null,
        b.anamnesis ?? null,
        b.current_medications ?? b.currentMedications ?? null,
        b.allergies ?? null,
        b.physical_exam ?? b.physicalExam ?? null,
        b.diagnosis ?? null,
        b.treatment_plan ?? b.treatmentPlan ?? null,
        b.notes ?? null,
        triBool(b.is_pregnant),
        triBool(b.tobacco_use),
        triBool(b.alcohol_use),
        triBool(b.drug_use),
        req.params.id,
        userId,
      ]
    )
    if (!data) return res.status(404).json({ error: 'Historia clínica no encontrada' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const data = await queryOne(
      'DELETE FROM clinical_records WHERE id = $1 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2) RETURNING id',
      [req.params.id, userId]
    )
    if (!data) return res.status(404).json({ error: 'Historia clínica no encontrada' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
