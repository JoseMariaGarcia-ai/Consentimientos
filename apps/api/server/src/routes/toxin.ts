import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { resolvePatientDoctorScope, ownPatientIdsSubquery, patientInScope } from '../lib/doctorScope'

const router = Router()

async function belongsToClinic(table: string, id: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1 AND clinic_id = $2`, [id, clinicId])
  return !!row
}

async function getClinicId(userId: string): Promise<string | null> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  return row?.clinic_id ?? null
}

// A linked consent must belong to the same clinic AND the same patient as the toxin record.
async function consentBelongsToPatient(consentId: string, patientId: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(
    `SELECT cr.id FROM consent_records cr
     JOIN patients p ON p.id = cr.patient_id
     WHERE cr.id = $1 AND cr.patient_id = $2 AND p.clinic_id = $3`,
    [consentId, patientId, clinicId]
  )
  return !!row
}

// GET /api/toxin?date_from=&date_to=&doctor_id=&patient_id=&lot_number=
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { date_from, date_to, doctor_id, patient_id, lot_number } = req.query
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.json([])
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.json([])

    let sql = `
      SELECT t.*, row_to_json(p) AS patient, row_to_json(d) AS doctor
      FROM toxin_records t
      LEFT JOIN patients p ON p.id = t.patient_id
      LEFT JOIN doctors d ON d.id = t.doctor_id
      WHERE t.clinic_id = $1
    `
    const params: any[] = [clinicId]
    if (scope)      { params.push(scope);             sql += ` AND t.patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    if (date_from)  { params.push(date_from);        sql += ` AND t.application_date >= $${params.length}` }
    if (date_to)    { params.push(date_to);           sql += ` AND t.application_date < $${params.length}` }
    if (doctor_id)  { params.push(doctor_id);         sql += ` AND t.doctor_id = $${params.length}` }
    if (patient_id) { params.push(patient_id);        sql += ` AND t.patient_id = $${params.length}` }
    if (lot_number) { params.push(`%${lot_number}%`); sql += ` AND t.lot_number ILIKE $${params.length}` }
    sql += ' ORDER BY t.application_date DESC'

    const data = await query(sql, params)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Registro no encontrado' })
    let sql = `SELECT t.*, row_to_json(p) AS patient, row_to_json(d) AS doctor
       FROM toxin_records t
       LEFT JOIN patients p ON p.id = t.patient_id
       LEFT JOIN doctors d ON d.id = t.doctor_id
       WHERE t.id = $1 AND t.clinic_id = $2`
    const params: any[] = [req.params.id, clinicId]
    if (scope) { params.push(scope); sql += ` AND t.patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    const data = await queryOne<any>(sql, params)
    if (!data) return res.status(404).json({ error: 'Registro no encontrado' })

    if (data.consent_id) {
      const consent = await queryOne<{ treatment_type: string; signed_at: string }>(
        `SELECT ct.treatment_type, cr.signed_at
         FROM consent_records cr
         LEFT JOIN consent_templates ct ON ct.id = cr.template_id
         WHERE cr.id = $1`,
        [data.consent_id]
      )
      data.consent = consent
    }
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id, doctor_id, application_date, brand_name, lot_number, expiry_date, manufacturer, treated_zones, vials_opened, consent_id, doctor_signature, notes } = req.body
  if (!patient_id || !application_date || !brand_name || !lot_number || !expiry_date || !manufacturer) {
    return res.status(400).json({ error: 'patient_id, application_date, brand_name, lot_number, expiry_date y manufacturer son obligatorios' })
  }
  if (!doctor_signature) {
    return res.status(400).json({ error: 'La firma del médico es obligatoria para guardar el registro' })
  }
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(403).json({ error: 'Tu cuenta no está vinculada a ninguna ficha de doctor' })

    if (!(await belongsToClinic('patients', patient_id, clinicId))) return res.status(404).json({ error: 'Paciente no encontrado' })
    if (scope && !(await patientInScope(patient_id, scope))) return res.status(404).json({ error: 'Paciente no encontrado' })
    if (doctor_id && !(await belongsToClinic('doctors', doctor_id, clinicId))) return res.status(404).json({ error: 'Doctor no encontrado' })
    if (consent_id && !(await consentBelongsToPatient(consent_id, patient_id, clinicId))) {
      return res.status(404).json({ error: 'Consentimiento no encontrado para este paciente' })
    }

    const zones = Array.isArray(treated_zones) ? treated_zones : []
    const totalUnits = zones.reduce((sum: number, z: any) => sum + (Number(z.units) || 0), 0)

    const data = await queryOne(
      `INSERT INTO toxin_records
         (clinic_id, patient_id, doctor_id, application_date, brand_name, lot_number, expiry_date, manufacturer,
          treated_zones, total_units, vials_opened, consent_id, doctor_signature, doctor_signed_at, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),$14,$15) RETURNING *`,
      [clinicId, patient_id, doctor_id ?? null, application_date, brand_name, lot_number, expiry_date, manufacturer,
       JSON.stringify(zones), totalUnits, Number(vials_opened) || 1, consent_id ?? null, doctor_signature, notes ?? null, userId]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id, doctor_id, application_date, brand_name, lot_number, expiry_date, manufacturer, treated_zones, vials_opened, consent_id, doctor_signature, notes } = req.body
  if (!doctor_signature) {
    return res.status(400).json({ error: 'La firma del médico es obligatoria para guardar el registro' })
  }
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Registro no encontrado' })
    const existing = await queryOne<{ patient_id: string }>(
      'SELECT patient_id FROM toxin_records WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId]
    )
    if (!existing) return res.status(404).json({ error: 'Registro no encontrado' })
    if (scope && !(await patientInScope(existing.patient_id, scope))) return res.status(404).json({ error: 'Registro no encontrado' })
    if (!(await belongsToClinic('patients', patient_id, clinicId))) return res.status(404).json({ error: 'Paciente no encontrado' })
    if (scope && !(await patientInScope(patient_id, scope))) return res.status(404).json({ error: 'Paciente no encontrado' })
    if (doctor_id && !(await belongsToClinic('doctors', doctor_id, clinicId))) return res.status(404).json({ error: 'Doctor no encontrado' })
    if (consent_id && !(await consentBelongsToPatient(consent_id, patient_id, clinicId))) {
      return res.status(404).json({ error: 'Consentimiento no encontrado para este paciente' })
    }

    const zones = Array.isArray(treated_zones) ? treated_zones : []
    const totalUnits = zones.reduce((sum: number, z: any) => sum + (Number(z.units) || 0), 0)

    const data = await queryOne(
      `UPDATE toxin_records SET
         patient_id=$1, doctor_id=$2, application_date=$3, brand_name=$4, lot_number=$5,
         expiry_date=$6, manufacturer=$7, treated_zones=$8, total_units=$9, vials_opened=$10,
         consent_id=$11, doctor_signature=$12, doctor_signed_at=NOW(), notes=$13, updated_at=NOW()
       WHERE id=$14 AND clinic_id=$15 RETURNING *`,
      [patient_id, doctor_id ?? null, application_date, brand_name, lot_number, expiry_date, manufacturer,
       JSON.stringify(zones), totalUnits, Number(vials_opened) || 1, consent_id ?? null, doctor_signature, notes ?? null,
       req.params.id, clinicId]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Registro no encontrado' })
    let sql = 'DELETE FROM toxin_records WHERE id = $1 AND clinic_id = $2'
    const params: any[] = [req.params.id, clinicId]
    if (scope) { params.push(scope); sql += ` AND patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    sql += ' RETURNING id'
    const data = await queryOne(sql, params)
    if (!data) return res.status(404).json({ error: 'Registro no encontrado' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
