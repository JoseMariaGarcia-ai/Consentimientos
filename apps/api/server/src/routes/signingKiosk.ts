import { Router } from 'express'
import crypto from 'crypto'
import { query, queryOne } from '../lib/db'
import { sendConsentEmail } from '../lib/consentEmail'

const router = Router()

async function consentBelongsToDeviceClinic(consentId: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(
    `SELECT cr.id FROM consent_records cr JOIN patients p ON p.id = cr.patient_id
     WHERE cr.id = $1 AND p.clinic_id = $2`,
    [consentId, clinicId]
  )
  return !!row
}

// GET /api/signing-kiosk/pending — atomically claims the oldest pending
// handoff for this device's clinic and returns the full consent payload
// (same shape as GET /api/consents/:id) so the tablet can render it without
// a second round trip.
router.get('/pending', async (req, res) => {
  const { clinic_id: clinicId } = (req as any).device
  try {
    const handoff = await queryOne<{ id: string; consent_id: string }>(
      `UPDATE consent_signing_handoffs SET status='claimed', device_id=$1, claimed_at=NOW()
       WHERE id = (
         SELECT id FROM consent_signing_handoffs
         WHERE clinic_id = $2 AND status = 'pending'
         ORDER BY created_at ASC LIMIT 1
       )
       RETURNING id, consent_id`,
      [(req as any).device.id, clinicId]
    )
    if (!handoff) return res.json(null)

    const consent = await queryOne<any>(
      `SELECT cr.*, row_to_json(p) AS patient, row_to_json(d) AS doctor, row_to_json(t) AS template
       FROM consent_records cr
       JOIN patients p ON p.id = cr.patient_id
       LEFT JOIN doctors d ON d.id = cr.doctor_id
       LEFT JOIN consent_templates t ON t.id = cr.template_id
       WHERE cr.id = $1`,
      [handoff.consent_id]
    )
    if (!consent) return res.json(null)

    // row_to_json(t) devuelve las columnas de consent_templates tal cual
    // (content_json, legal_clauses_json), pero useConsentWithLegal — igual
    // que el resto de la app — espera camelCase (así lo devuelve ya
    // GET /api/consents/templates). Sin este remapeo, KioskConsentSigner
    // recibe contentJson=undefined y revienta al montar (pantalla en blanco
    // en la tablet, sin nada firmable).
    if (consent.template) {
      consent.template.contentJson = consent.template.content_json
      consent.template.legalClausesJson = consent.template.legal_clauses_json
    }

    return res.json({ handoffId: handoff.id, consent })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/signing-kiosk/consents/:id/doctor-signature
router.post('/consents/:id/doctor-signature', async (req, res) => {
  const { clinic_id: clinicId } = (req as any).device
  const { id } = req.params
  const { signature_data_url } = req.body
  try {
    if (!(await consentBelongsToDeviceClinic(id, clinicId))) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    const data = await queryOne(
      `UPDATE consent_records SET doctor_signature_data_url=$1, doctor_signed_at=NOW() WHERE id=$2 RETURNING *`,
      [signature_data_url, id]
    )
    if (!data) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/signing-kiosk/consents/:id/patient-signature — finalises the
// consent exactly like the desktop flow, then marks the handoff completed
// so the desktop's poll picks it up.
router.post('/consents/:id/patient-signature', async (req, res) => {
  const { clinic_id: clinicId, id: deviceId } = (req as any).device
  const { id } = req.params
  const { signature_data_url, biometric_json, client_timestamp, image_auth_educational, image_auth_marketing } = req.body
  try {
    if (!(await consentBelongsToDeviceClinic(id, clinicId))) return res.status(404).json({ error: 'Consentimiento no encontrado' })
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
      [id, JSON.stringify({ ...data, signed_at: new Date(), signed_via: 'signing_device', device_id: deviceId })]
    )
    await query(
      `UPDATE consent_signing_handoffs SET status='completed', completed_at=NOW() WHERE consent_id=$1 AND device_id=$2 AND status='claimed'`,
      [id, deviceId]
    )
    // Mismo aviso inmediato que en la firma directa (ver routes/signature.ts)
    // — no depender de que el escritorio que hace polling siga abierto para
    // generar y subir el PDF.
    sendConsentEmail({ consentId: id, clinicId })
      .catch(err => console.error('[consentEmail] fallo enviando aviso inmediato (tablet):', err.message))
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
