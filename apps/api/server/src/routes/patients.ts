import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { sendPatientWelcomeEmail } from '../lib/patientWelcomeEmail'
import { resolvePatientDoctorScope, ownPatientIdsSubquery } from '../lib/doctorScope'

const router = Router()

// Accept both camelCase (frontend) and snake_case
function parseBody(b: any) {
  const firstName = b.first_name ?? b.firstName ?? null
  const lastName  = b.last_name  ?? b.lastName  ?? null
  return {
    first_name:    firstName,
    last_name:     lastName,
    full_name:     b.full_name ?? b.fullName ?? [firstName, lastName].filter(Boolean).join(' '),
    date_of_birth: (b.date_of_birth ?? b.dateOfBirth) || null,
    id_document:   b.id_document   ?? b.idDocument      ?? null,
    id_doc_type:   b.id_doc_type   ?? b.idDocType       ?? 'DNI',
    phone:         b.phone         ?? null,
    email:         (b.email ?? '').trim() || null,
    address:       b.address       ?? null,
    allergies:     b.allergies     ?? null,
    medications:   b.medications   ?? null,
    blood_type:    b.blood_type    ?? b.bloodType        ?? null,
  }
}

router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.json([])
    let sql = `SELECT * FROM patients WHERE clinic_id = (SELECT clinic_id FROM app_users WHERE id = $1)`
    const params: any[] = [userId]
    if (scope) { params.push(scope); sql += ` AND id IN ${ownPatientIdsSubquery(params.length)}` }
    sql += ' ORDER BY created_at DESC'
    const data = await query(sql, params)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(403).json({ error: 'Tu cuenta no está vinculada a ninguna ficha de doctor' })
    const f = parseBody(req.body)
    const data = await queryOne<any>(
      `INSERT INTO patients (clinic_id, first_name, last_name, full_name, date_of_birth, id_document, id_doc_type, phone, email, address, allergies, medications, blood_type, created_by_doctor_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [clinicRow?.clinic_id, f.first_name, f.last_name, f.full_name, f.date_of_birth, f.id_document, f.id_doc_type, f.phone, f.email, f.address, f.allergies, f.medications, f.blood_type, scope || null]
    )

    // Auto-create patient user and send welcome email if email provided
    if (data && f.email) {
      try {
        const existing = await queryOne<{ id: string }>('SELECT id FROM app_users WHERE lower(email) = lower($1)', [f.email])
        let patientUserId: string
        if (existing) {
          patientUserId = existing.id
        } else {
          const newUser = await queryOne<{ id: string }>(
            `INSERT INTO app_users (email, full_name, role, clinic_id) VALUES ($1, $2, 'patient', $3) RETURNING id`,
            [f.email, f.full_name, clinicRow?.clinic_id]
          )
          patientUserId = newUser!.id
        }
        await query('UPDATE patients SET user_id = $1 WHERE id = $2', [patientUserId, data.id])
        data.user_id = patientUserId

        // Get clinic name for email
        const clinic = await queryOne<{ name: string }>('SELECT name FROM clinics WHERE id = $1', [clinicRow?.clinic_id])
        await sendPatientWelcomeEmail({ ...data, user_id: patientUserId }, clinic?.name ?? 'Tu clínica')
      } catch (emailErr: any) {
        console.error(`[patients] welcome email failed for patient ${data.id} (${f.email}):`, emailErr.message)
        // Don't fail the request if email fails
      }
    }

    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Reintento manual: por si el envío automático al crear el paciente falló
// (SMTP caído, email con typo corregido después, etc.) sin dejar rastro
// visible para el usuario.
router.post('/:id/resend-welcome', async (req, res) => {
  const { userId } = (req as any).user
  const { id } = req.params
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Paciente no encontrado' })
    let patientSql = 'SELECT * FROM patients WHERE id = $1 AND clinic_id = $2'
    const patientParams: any[] = [id, clinicRow?.clinic_id]
    if (scope) { patientParams.push(scope); patientSql += ` AND id IN ${ownPatientIdsSubquery(patientParams.length)}` }
    const patient = await queryOne<any>(patientSql, patientParams)
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' })
    const email = (patient.email ?? '').trim()
    if (!email) return res.status(400).json({ error: 'El paciente no tiene email' })

    const existing = await queryOne<{ id: string }>('SELECT id FROM app_users WHERE lower(email) = lower($1)', [email])
    let patientUserId: string
    if (existing) {
      patientUserId = existing.id
    } else {
      const newUser = await queryOne<{ id: string }>(
        `INSERT INTO app_users (email, full_name, role, clinic_id) VALUES ($1, $2, 'patient', $3) RETURNING id`,
        [email, patient.full_name, clinicRow?.clinic_id]
      )
      patientUserId = newUser!.id
    }
    if (patient.user_id !== patientUserId) {
      await query('UPDATE patients SET user_id = $1 WHERE id = $2', [patientUserId, patient.id])
    }

    const clinic = await queryOne<{ name: string }>('SELECT name FROM clinics WHERE id = $1', [clinicRow?.clinic_id])
    await sendPatientWelcomeEmail({ ...patient, email, user_id: patientUserId }, clinic?.name ?? 'Tu clínica')
    return res.json({ sent: true })
  } catch (err: any) {
    console.error(`[patients] resend-welcome failed for patient ${id}:`, err.message)
    return res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const { id } = req.params
  const f = parseBody(req.body)
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Paciente no encontrado' })
    let sql = `UPDATE patients SET first_name=$1, last_name=$2, full_name=$3, date_of_birth=$4, id_document=$5, id_doc_type=$6, phone=$7, email=$8, address=$9, allergies=$10, medications=$11, blood_type=$12, updated_at=NOW()
       WHERE id=$13 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $14)`
    const params: any[] = [f.first_name, f.last_name, f.full_name, f.date_of_birth, f.id_document, f.id_doc_type, f.phone, f.email, f.address, f.allergies, f.medications, f.blood_type, id, userId]
    if (scope) { params.push(scope); sql += ` AND id IN ${ownPatientIdsSubquery(params.length)}` }
    sql += ' RETURNING *'
    const data = await queryOne(sql, params)
    if (!data) return res.status(404).json({ error: 'Paciente no encontrado' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Paciente no encontrado' })
    let sql = 'DELETE FROM patients WHERE id = $1 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)'
    const params: any[] = [req.params.id, userId]
    if (scope) { params.push(scope); sql += ` AND id IN ${ownPatientIdsSubquery(params.length)}` }
    sql += ' RETURNING id'
    const data = await queryOne(sql, params)
    if (!data) return res.status(404).json({ error: 'Paciente no encontrado' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
