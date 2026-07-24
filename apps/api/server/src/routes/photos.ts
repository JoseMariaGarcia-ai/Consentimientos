import { Router } from 'express'
import { uploadFile, deleteFile, listFiles, getPresignedUrl } from '../lib/r2'
import { queryOne } from '../lib/db'
import { resolvePatientDoctorScope, patientInScope } from '../lib/doctorScope'

const router = Router()

async function ownsPatient(userId: string, patientId: string): Promise<boolean> {
  const row = await queryOne(
    'SELECT p.id FROM patients p WHERE p.id = $1 AND p.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)',
    [patientId, userId]
  )
  if (!row) return false
  const scope = await resolvePatientDoctorScope(userId)
  if (scope === '') return false
  if (scope && !(await patientInScope(patientId, scope))) return false
  return true
}

// GET /api/photos/:patientId — list photos with presigned URLs
router.get('/:patientId', async (req, res) => {
  const { userId } = (req as any).user
  try {
    if (!(await ownsPatient(userId, req.params.patientId))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    const prefix = `patients/${req.params.patientId}/photos/`
    const keys = await listFiles(prefix)
    const photos = await Promise.all(keys.map(async key => ({
      key,
      url: await getPresignedUrl(key),
    })))
    return res.json(photos)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/photos/:patientId — upload photo (base64 or multipart)
router.post('/:patientId', async (req, res) => {
  const { userId } = (req as any).user
  try {
    if (!(await ownsPatient(userId, req.params.patientId))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    const { fileBase64, fileName, contentType } = req.body
    if (!fileBase64 || !fileName) return res.status(400).json({ error: 'fileBase64 y fileName requeridos' })
    const buffer = Buffer.from(fileBase64, 'base64')
    const key = `patients/${req.params.patientId}/photos/${Date.now()}_${fileName}`
    await uploadFile(key, buffer, contentType ?? 'image/jpeg')
    const url = await getPresignedUrl(key)
    return res.status(201).json({ key, url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// DELETE /api/photos/file/:key(*) — delete by key. La key siempre tiene el
// formato patients/{patientId}/photos/... (generado arriba) — se valida que
// el paciente pertenezca a la clínica de quien borra antes de tocar R2.
router.delete('/file/:key(*)', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const match = req.params.key.match(/^patients\/([^/]+)\/photos\//)
    if (!match) return res.status(400).json({ error: 'Clave de fichero no válida' })
    if (!(await ownsPatient(userId, match[1]))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    await deleteFile(req.params.key)
    return res.json({ ok: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
