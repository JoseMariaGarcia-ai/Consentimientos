import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

async function belongsToClinic(table: string, id: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1 AND clinic_id = $2`, [id, clinicId])
  return !!row
}

// GET /api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { from, to } = req.query
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    let sql = `
      SELECT a.*, row_to_json(p) AS patient, row_to_json(d) AS doctor, row_to_json(t) AS treatment
      FROM appointments a
      LEFT JOIN patients p ON p.id = a.patient_id
      LEFT JOIN doctors d ON d.id = a.doctor_id
      LEFT JOIN treatments t ON t.id = a.treatment_id
      WHERE a.clinic_id = $1 AND a.status != 'cancelled'
    `
    const params: any[] = [clinicRow?.clinic_id]
    if (from) { params.push(from); sql += ` AND a.start_time >= $${params.length}` }
    if (to)   { params.push(to);   sql += ` AND a.start_time < $${params.length}` }
    sql += ' ORDER BY a.start_time ASC'
    const data = await query(sql, params)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id, doctor_id, treatment_id, branch, start_time, notes } = req.body
  if (!patient_id || !treatment_id || !start_time) {
    return res.status(400).json({ error: 'patient_id, treatment_id y start_time son obligatorios' })
  }
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinicId = clinicRow?.clinic_id
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })

    const treatment = await queryOne<{ duration_minutes: number }>(
      'SELECT duration_minutes FROM treatments WHERE id = $1 AND clinic_id = $2', [treatment_id, clinicId]
    )
    if (!treatment) return res.status(404).json({ error: 'Tratamiento no encontrado' })
    if (!(await belongsToClinic('patients', patient_id, clinicId))) return res.status(404).json({ error: 'Paciente no encontrado' })
    if (doctor_id && !(await belongsToClinic('doctors', doctor_id, clinicId))) return res.status(404).json({ error: 'Doctor no encontrado' })

    const start = new Date(start_time)
    const end = new Date(start.getTime() + treatment.duration_minutes * 60000)

    if (doctor_id) {
      const clash = await queryOne(
        `SELECT id FROM appointments WHERE doctor_id = $1 AND status != 'cancelled'
         AND start_time < $2 AND end_time > $3 LIMIT 1`,
        [doctor_id, end.toISOString(), start.toISOString()]
      )
      if (clash) return res.status(409).json({ error: 'El doctor ya tiene una cita en ese horario' })
    }

    const data = await queryOne(
      `INSERT INTO appointments (clinic_id, patient_id, doctor_id, treatment_id, branch, start_time, end_time, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [clinicId, patient_id, doctor_id ?? null, treatment_id, branch ?? null, start.toISOString(), end.toISOString(), notes ?? null]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id, doctor_id, treatment_id, branch, start_time, notes, status } = req.body
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinicId = clinicRow?.clinic_id
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    if (!(await belongsToClinic('appointments', req.params.id, clinicId))) return res.status(404).json({ error: 'Cita no encontrada' })

    const treatment = await queryOne<{ duration_minutes: number }>(
      'SELECT duration_minutes FROM treatments WHERE id = $1 AND clinic_id = $2', [treatment_id, clinicId]
    )
    if (!treatment) return res.status(404).json({ error: 'Tratamiento no encontrado' })
    if (!(await belongsToClinic('patients', patient_id, clinicId))) return res.status(404).json({ error: 'Paciente no encontrado' })
    if (doctor_id && !(await belongsToClinic('doctors', doctor_id, clinicId))) return res.status(404).json({ error: 'Doctor no encontrado' })

    const start = new Date(start_time)
    const end = new Date(start.getTime() + treatment.duration_minutes * 60000)

    if (doctor_id) {
      const clash = await queryOne(
        `SELECT id FROM appointments WHERE doctor_id = $1 AND id != $2 AND status != 'cancelled'
         AND start_time < $3 AND end_time > $4 LIMIT 1`,
        [doctor_id, req.params.id, end.toISOString(), start.toISOString()]
      )
      if (clash) return res.status(409).json({ error: 'El doctor ya tiene una cita en ese horario' })
    }

    const data = await queryOne(
      `UPDATE appointments SET patient_id=$1, doctor_id=$2, treatment_id=$3, branch=$4, start_time=$5, end_time=$6, notes=$7, status=$8, updated_at=NOW()
       WHERE id=$9 AND clinic_id=$10 RETURNING *`,
      [patient_id, doctor_id ?? null, treatment_id, branch ?? null, start.toISOString(), end.toISOString(), notes ?? null, status ?? 'scheduled', req.params.id, clinicId]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const data = await queryOne(
      'DELETE FROM appointments WHERE id = $1 AND clinic_id = $2 RETURNING id',
      [req.params.id, clinicRow?.clinic_id]
    )
    if (!data) return res.status(404).json({ error: 'Cita no encontrada' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
