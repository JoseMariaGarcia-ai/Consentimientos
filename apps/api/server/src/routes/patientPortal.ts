import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { getPresignedUrl } from '../lib/r2'

const router = Router()

// Middleware: ensure caller is a patient and get their patient record
//
// user_id no es único en patients: si el mismo email se usa como paciente
// en dos clínicas distintas, ambos registros de paciente comparten el mismo
// app_users.id (patients.ts dedupa por email a nivel global, no por
// clínica). Sin ORDER BY/LIMIT el resultado dependería del orden interno
// de Postgres y podría "saltar" de una clínica a otra entre peticiones —
// aquí se fija de forma determinista al registro más reciente. Esto no
// resuelve el caso de fondo (ese paciente solo puede ver una de sus dos
// clínicas desde este portal), que requiere una decisión de producto.
async function getPatientRecord(userId: string) {
  const patient = await queryOne<any>(
    'SELECT * FROM patients WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  )
  if (!patient) throw { status: 403, message: 'No se encontró el perfil de paciente' }
  return patient
}

// GET /api/patient/me
router.get('/me', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const patient = await queryOne<any>(
      `SELECT p.*, c.name AS clinic_name, c.phone AS clinic_phone, c.email AS clinic_email,
              c.logo_url AS clinic_logo, c.logo_key AS clinic_logo_key
       FROM patients p
       LEFT JOIN clinics c ON c.id = p.clinic_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC LIMIT 1`,
      [userId]
    )
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' })
    // logo_key (subido desde Clínica > Logo) manda sobre la URL externa
    // vieja — igual que en GET /clinic, se resuelve en cada lectura.
    if (patient.clinic_logo_key) patient.clinic_logo = await getPresignedUrl(patient.clinic_logo_key, 24 * 60 * 60)
    delete patient.clinic_logo_key
    return res.json(patient)
  } catch (err: any) { return res.status((err as any).status ?? 500).json({ error: err.message }) }
})

// GET /api/patient/consents
router.get('/consents', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const patient = await getPatientRecord(userId)
    const data = await query<any>(
      `SELECT cr.id, cr.status, cr.created_at, cr.signed_at,
              t.treatment_type, t.id AS template_id,
              d.name AS doctor_name
       FROM consent_records cr
       LEFT JOIN consent_templates t ON t.id = cr.template_id
       LEFT JOIN doctors d ON d.id = cr.doctor_id
       WHERE cr.patient_id = $1
       ORDER BY cr.created_at DESC`,
      [patient.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status((err as any).status ?? 500).json({ error: err.message }) }
})

// GET /api/patient/clinical-records
router.get('/clinical-records', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const patient = await getPatientRecord(userId)
    const data = await query<any>(
      `SELECT cr.id, cr.date, cr.reason_for_visit, cr.diagnosis, cr.treatment_plan,
              cr.anamnesis, cr.current_medications, cr.allergies, cr.physical_exam,
              cr.notes, cr.updated_at,
              d.name AS doctor_name
       FROM clinical_records cr
       LEFT JOIN doctors d ON d.id = cr.doctor_id
       WHERE cr.patient_id = $1
       ORDER BY cr.date DESC`,
      [patient.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status((err as any).status ?? 500).json({ error: err.message }) }
})

// GET /api/patient/photo-sessions
router.get('/photo-sessions', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const patient = await getPatientRecord(userId)
    const sessions = await query<any>(
      `SELECT ps.id, ps.name, ps.notes, ps.session_date,
              d.name AS doctor_name
       FROM photo_sessions ps
       LEFT JOIN doctors d ON d.id = ps.doctor_id
       WHERE ps.patient_id = $1
       ORDER BY ps.session_date DESC`,
      [patient.id]
    )
    // Enrich with photo URLs
    const enriched = await Promise.all(sessions.map(async (s: any) => {
      const photos = await query<any>(
        'SELECT id, original_name, r2_key, order_index FROM photos WHERE session_id = $1 ORDER BY order_index',
        [s.id]
      )
      const photosWithUrls = await Promise.all(photos.map(async (p: any) => ({
        ...p,
        url: await getPresignedUrl(p.r2_key, 3600),
      })))
      return { ...s, photos: photosWithUrls }
    }))
    return res.json(enriched)
  } catch (err: any) { return res.status((err as any).status ?? 500).json({ error: err.message }) }
})

export default router
