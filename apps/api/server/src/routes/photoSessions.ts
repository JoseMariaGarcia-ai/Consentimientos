import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { uploadFile, deleteFile, getPresignedUrl } from '../lib/r2'
import { resolvePatientDoctorScope, ownPatientIdsSubquery, patientInScope } from '../lib/doctorScope'

const router = Router()
const MAX_PHOTOS_PER_SESSION = 10

async function belongsToClinic(table: string, id: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1 AND clinic_id = $2`, [id, clinicId])
  return !!row
}

async function enrichSession(session: any) {
  const photos = await query<any>(
    'SELECT * FROM photos WHERE session_id = $1 ORDER BY order_index, created_at',
    [session.id]
  )
  const photosWithUrls = await Promise.all(photos.map(async p => ({
    ...p,
    url: await getPresignedUrl(p.r2_key),
  })))
  return { ...session, photos: photosWithUrls }
}

// GET /api/photo-sessions?patientId=
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patientId } = req.query
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.json([])
    let base = `
      SELECT ps.*, row_to_json(p) AS patient, row_to_json(d) AS doctor
      FROM photo_sessions ps
      LEFT JOIN patients p ON p.id = ps.patient_id
      LEFT JOIN doctors d ON d.id = ps.doctor_id
      WHERE ps.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $1)
    `
    const params: any[] = [userId]
    if (scope) { params.push(scope); base += ` AND ps.patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    if (patientId) { params.push(patientId); base += ` AND ps.patient_id = $${params.length}` }
    base += ' ORDER BY ps.session_date DESC'
    const sessions = await query(base, params)

    const enriched = await Promise.all(sessions.map(enrichSession))
    return res.json(enriched)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/photo-sessions — create session
router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id, name, notes, session_date } = req.body
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinicId = clinicRow!.clinic_id
    const { doctor_id } = req.body
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(403).json({ error: 'Tu cuenta no está vinculada a ninguna ficha de doctor' })
    if (!(await belongsToClinic('patients', patient_id, clinicId))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    if (scope && !(await patientInScope(patient_id, scope))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    if (doctor_id && !(await belongsToClinic('doctors', doctor_id, clinicId))) {
      return res.status(404).json({ error: 'Doctor no encontrado' })
    }
    const session = await queryOne(
      `INSERT INTO photo_sessions (clinic_id, patient_id, doctor_id, name, notes, session_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [clinicId, patient_id, doctor_id ?? null, name ?? null, notes ?? null, session_date || new Date().toISOString()]
    )
    return res.status(201).json({ ...session, photos: [] })
  } catch (err: any) { return res.status((err as any).status ?? 500).json({ error: err.message }) }
})

// PUT /api/photo-sessions/:id — update session metadata
router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const { name, notes, session_date } = req.body
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Sesión no encontrada' })
    let sql = `UPDATE photo_sessions SET name=$1, notes=$2, session_date=$3
       WHERE id=$4 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $5)`
    const params: any[] = [name ?? null, notes ?? null, session_date || new Date().toISOString(), req.params.id, userId]
    if (scope) { params.push(scope); sql += ` AND patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    sql += ' RETURNING *'
    const session = await queryOne(sql, params)
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' })
    return res.json(session)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// DELETE /api/photo-sessions/:id — delete session + all photos from R2
router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Sesión no encontrada' })
    let sql = 'SELECT id FROM photo_sessions WHERE id = $1 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)'
    const params: any[] = [req.params.id, userId]
    if (scope) { params.push(scope); sql += ` AND patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    const owned = await queryOne(sql, params)
    if (!owned) return res.status(404).json({ error: 'Sesión no encontrada' })
    const photos = await query<any>('SELECT r2_key FROM photos WHERE session_id = $1', [req.params.id])
    await Promise.all(photos.map(p => deleteFile(p.r2_key).catch(() => {})))
    await query('DELETE FROM photo_sessions WHERE id = $1', [req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/photo-sessions/:id/photos — upload photo to session
router.post('/:id/photos', async (req, res) => {
  const { userId } = (req as any).user
  const sessionId = req.params.id
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Sesión no encontrada' })
    let sql = 'SELECT id FROM photo_sessions WHERE id = $1 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)'
    const params: any[] = [sessionId, userId]
    if (scope) { params.push(scope); sql += ` AND patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    const owned = await queryOne(sql, params)
    if (!owned) return res.status(404).json({ error: 'Sesión no encontrada' })

    const count = await queryOne<{ count: string }>('SELECT COUNT(*) FROM photos WHERE session_id = $1', [sessionId])
    if (parseInt(count?.count ?? '0') >= MAX_PHOTOS_PER_SESSION) {
      return res.status(400).json({ error: `Máximo ${MAX_PHOTOS_PER_SESSION} fotos por sesión` })
    }

    const { fileBase64, fileName, contentType, orderIndex } = req.body
    if (!fileBase64 || !fileName) return res.status(400).json({ error: 'fileBase64 y fileName requeridos' })

    const buffer = Buffer.from(fileBase64, 'base64')
    const key = `sessions/${sessionId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    await uploadFile(key, buffer, contentType ?? 'image/jpeg')

    const photo = await queryOne(
      'INSERT INTO photos (session_id, r2_key, original_name, order_index) VALUES ($1,$2,$3,$4) RETURNING *',
      [sessionId, key, fileName, orderIndex ?? 0]
    )
    const url = await getPresignedUrl(key)
    return res.status(201).json({ ...photo, url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// DELETE /api/photo-sessions/photos/:photoId — delete single photo
router.delete('/photos/:photoId', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Foto no encontrada' })
    let sql = `SELECT ph.r2_key FROM photos ph
       JOIN photo_sessions ps ON ps.id = ph.session_id
       WHERE ph.id = $1 AND ps.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)`
    const params: any[] = [req.params.photoId, userId]
    if (scope) { params.push(scope); sql += ` AND ps.patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    const photo = await queryOne<any>(sql, params)
    if (!photo) return res.status(404).json({ error: 'Foto no encontrada' })
    await deleteFile(photo.r2_key).catch(() => {})
    await query('DELETE FROM photos WHERE id = $1', [req.params.photoId])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
