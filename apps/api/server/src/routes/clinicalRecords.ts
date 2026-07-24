import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { resolvePatientDoctorScope, ownPatientIdsSubquery, patientInScope } from '../lib/doctorScope'

const router = Router()

async function belongsToClinic(table: string, id: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1 AND clinic_id = $2`, [id, clinicId])
  return !!row
}

// Tri-estado: true/false explícitos, o null si no se ha preguntado/consta.
function triBool(v: unknown): boolean | null {
  return v === true || v === false ? v : null
}

// Cantidad libre (p.ej. "10 cigarrillos/día") — solo tiene sentido cuando el
// hábito es "Sí", pero se guarda tal cual venga (string vacío -> null).
function quantityText(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patientId } = req.query
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.json([])
    let base = `
      SELECT cr.*, row_to_json(p) AS patient, row_to_json(d) AS doctor
      FROM clinical_records cr
      LEFT JOIN patients p ON p.id = cr.patient_id
      LEFT JOIN doctors d ON d.id = cr.doctor_id
      WHERE cr.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $1)
    `
    const params: any[] = [userId]
    if (scope) { params.push(scope); base += ` AND cr.patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    if (patientId) { params.push(patientId); base += ` AND cr.patient_id = $${params.length}` }
    base += ' ORDER BY cr.date DESC'
    const data = await query(base, params)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const b = req.body
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinicId = clinicRow!.clinic_id
    const patientId = b.patient_id ?? b.patientId
    const doctorId  = b.doctor_id  ?? b.doctorId  ?? null
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(403).json({ error: 'Tu cuenta no está vinculada a ninguna ficha de doctor' })
    if (!(await belongsToClinic('patients', patientId, clinicId))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    if (scope && !(await patientInScope(patientId, scope))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    if (doctorId && !(await belongsToClinic('doctors', doctorId, clinicId))) {
      return res.status(404).json({ error: 'Doctor no encontrado' })
    }
    const data = await queryOne(
      `INSERT INTO clinical_records
        (clinic_id, patient_id, doctor_id, date, reason_for_visit, anamnesis, current_medications, allergies, physical_exam, diagnosis, treatment_plan, notes, is_pregnant, tobacco_use, alcohol_use, drug_use, tobacco_quantity, alcohol_quantity, drug_quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [
        clinicId,
        patientId,
        doctorId,
        b.date || new Date().toISOString().split('T')[0],
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
        quantityText(b.tobacco_quantity),
        quantityText(b.alcohol_quantity),
        quantityText(b.drug_quantity),
      ]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status((err as any).status ?? 500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const b = req.body
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinicId = clinicRow!.clinic_id
    const patientId = b.patient_id ?? b.patientId
    const doctorId  = b.doctor_id  ?? b.doctorId  ?? null
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Historia clínica no encontrada' })
    if (!(await belongsToClinic('patients', patientId, clinicId))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    if (doctorId && !(await belongsToClinic('doctors', doctorId, clinicId))) {
      return res.status(404).json({ error: 'Doctor no encontrado' })
    }
    if (scope && !(await patientInScope(patientId, scope))) {
      return res.status(404).json({ error: 'Historia clínica no encontrada' })
    }
    let sql = `UPDATE clinical_records SET
        patient_id=$1, doctor_id=$2, date=$3, reason_for_visit=$4, anamnesis=$5,
        current_medications=$6, allergies=$7, physical_exam=$8, diagnosis=$9,
        treatment_plan=$10, notes=$11, is_pregnant=$12, tobacco_use=$13,
        alcohol_use=$14, drug_use=$15, tobacco_quantity=$16, alcohol_quantity=$17,
        drug_quantity=$18, updated_at=NOW()
       WHERE id=$19 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $20)`
    const params: any[] = [
      patientId,
      doctorId,
      b.date || new Date().toISOString().split('T')[0],
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
      quantityText(b.tobacco_quantity),
      quantityText(b.alcohol_quantity),
      quantityText(b.drug_quantity),
      req.params.id,
      userId,
    ]
    if (scope) { params.push(scope); sql += ` AND patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    sql += ' RETURNING *'
    const data = await queryOne(sql, params)
    if (!data) return res.status(404).json({ error: 'Historia clínica no encontrada' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Historia clínica no encontrada' })
    let sql = 'DELETE FROM clinical_records WHERE id = $1 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)'
    const params: any[] = [req.params.id, userId]
    if (scope) { params.push(scope); sql += ` AND patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    sql += ' RETURNING id'
    const data = await queryOne(sql, params)
    if (!data) return res.status(404).json({ error: 'Historia clínica no encontrada' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
