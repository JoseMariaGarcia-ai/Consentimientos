import { Router } from 'express'
import crypto from 'crypto'
import { queryOne, query } from '../lib/db'
import { sendConsentEmail } from '../lib/consentEmail'
import { resolvePatientDoctorScope, patientInScope } from '../lib/doctorScope'

const router = Router()

async function consentBelongsToClinic(consentId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ patient_id: string }>(
    `SELECT cr.patient_id FROM consent_records cr
     JOIN patients p ON p.id = cr.patient_id
     WHERE cr.id = $1 AND p.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)`,
    [consentId, userId]
  )
  if (!row) return false
  const scope = await resolvePatientDoctorScope(userId)
  if (scope === '') return false
  if (scope && !(await patientInScope(row.patient_id, scope))) return false
  return true
}

// Doctor signature — saves doctor_signature_data_url, status stays pending
router.post('/:id/doctor', async (req, res) => {
  const { userId } = (req as any).user
  const { id } = req.params
  const { signature_data_url } = req.body
  try {
    if (!(await consentBelongsToClinic(id, userId))) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    const data = await queryOne(
      `UPDATE consent_records SET doctor_signature_data_url=$1, doctor_signed_at=NOW() WHERE id=$2 RETURNING *`,
      [signature_data_url, id]
    )
    if (!data) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Patient signature — finalises the record, status = signed
router.post('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const { id } = req.params
  const { signature_data_url, biometric_json, client_timestamp, image_auth_educational, image_auth_marketing } = req.body
  try {
    if (!(await consentBelongsToClinic(id, userId))) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    const document_hash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex')
    const data = await queryOne(
      `UPDATE consent_records SET status='signed', signature_data_url=$1, biometric_json=$2,
       document_hash=$3, client_timestamp=$4, server_timestamp=NOW(), signed_at=NOW(),
       ip_address=$5, user_agent=$6, image_auth_educational=$7, image_auth_marketing=$8 WHERE id=$9 RETURNING *`,
      [signature_data_url, biometric_json, document_hash, client_timestamp,
       req.ip, req.headers['user-agent'], !!image_auth_educational, !!image_auth_marketing, id]
    )
    if (!data) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    await query(
      `INSERT INTO audit_logs (consent_id, log_json) VALUES ($1, $2) ON CONFLICT (consent_id) DO UPDATE SET log_json=$2`,
      [id, JSON.stringify({ ...data, signed_at: new Date() })]
    )
    // Aviso inmediato al paciente, sin esperar a que el navegador genere y
    // suba el PDF (ver POST /pdf/upload) — así el email nunca depende de un
    // segundo paso en el cliente que podía fallar en silencio o no llegar a
    // ejecutarse (pestaña cerrada, red, etc.). Cuando el PDF se sube después,
    // sendConsentEmail se llama de nuevo con el adjunto real.
    queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
      .then(row => {
        if (row?.clinic_id) {
          sendConsentEmail({ consentId: id, clinicId: row.clinic_id })
            .catch(err => console.error('[consentEmail] fallo enviando aviso inmediato:', err.message))
        }
      })
      .catch(() => {})
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
