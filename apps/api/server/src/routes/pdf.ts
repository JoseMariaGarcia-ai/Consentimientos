import { Router } from 'express'
import { uploadFile, getPresignedUrl } from '../lib/r2'
import { queryOne } from '../lib/db'
import { sendConsentEmail } from '../lib/consentEmail'
import { resolvePatientDoctorScope, patientInScope } from '../lib/doctorScope'

const router = Router()

// El PDF se guarda bajo una clave keyed solo por consentId (sin clinic_id),
// así que hay que comprobar SIEMPRE que ese consentimiento pertenece a la
// clínica de quien pide/sube el PDF antes de tocar R2 — de lo contrario
// cualquier cuenta autenticada (de cualquier clínica) podría leer o
// sobrescribir el PDF firmado de un consentimiento ajeno con solo conocer
// su id. Si además es un doctor restringido, también debe ser un paciente
// dentro de su scope.
async function consentAccessible(consentId: string, userId: string): Promise<boolean> {
  const me = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  if (!me?.clinic_id) return false
  const consent = await queryOne<{ patient_id: string }>(
    `SELECT cr.patient_id FROM consent_records cr
     JOIN patients p ON p.id = cr.patient_id
     WHERE cr.id = $1 AND p.clinic_id = $2`,
    [consentId, me.clinic_id]
  )
  if (!consent) return false
  const scope = await resolvePatientDoctorScope(userId)
  if (scope === '') return false
  if (scope && !(await patientInScope(consent.patient_id, scope))) return false
  return true
}

// POST /api/pdf/upload — store signed consent PDF and (unless skipEmail) email patient.
// skipEmail se usa cuando el aviso inmediato ya se mandó desde el propio
// endpoint de firma (ver routes/signature.ts) — este PDF llega unos segundos
// más tarde generado en el navegador, y no debe disparar un segundo email.
router.post('/upload', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const { consentId, pdfBase64, skipEmail } = req.body
    if (!consentId || !pdfBase64) return res.status(400).json({ error: 'consentId y pdfBase64 requeridos' })
    if (!(await consentAccessible(consentId, userId))) return res.status(404).json({ error: 'Consentimiento no encontrado' })

    const buffer = Buffer.from(pdfBase64, 'base64')
    const key = `consents/${consentId}/consent.pdf`
    await uploadFile(key, buffer, 'application/pdf')
    const url = await getPresignedUrl(key, 86400)

    if (!skipEmail) {
      // Send email to patient (fire-and-forget — never block the response)
      const { userId } = (req as any).user
      queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
        .then(row => {
          if (row?.clinic_id) {
            sendConsentEmail({ consentId, pdfBuffer: buffer, clinicId: row.clinic_id })
              .catch(err => console.error('[consentEmail] failed:', err.message))
          }
        })
        .catch(() => {})
    }

    return res.status(201).json({ key, url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/pdf/:consentId — get download URL for a consent PDF
router.get('/:consentId', async (req, res) => {
  try {
    const { userId } = (req as any).user
    if (!(await consentAccessible(req.params.consentId, userId))) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    const key = `consents/${req.params.consentId}/consent.pdf`
    const url = await getPresignedUrl(key, 86400)
    return res.json({ url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
