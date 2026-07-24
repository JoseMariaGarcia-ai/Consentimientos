import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { resolvePatientDoctorScope, patientInScope } from '../lib/doctorScope'

const router = Router()

// POST /api/consent-handoff — desktop asks to hand a consent off to whatever
// signing tablet is paired with the clinic.
router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const { consent_id } = req.body
  if (!consent_id) return res.status(400).json({ error: 'consent_id requerido' })
  try {
    const me = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })

    const consent = await queryOne<{ id: string; patient_id: string }>(
      `SELECT cr.id, cr.patient_id FROM consent_records cr JOIN patients p ON p.id = cr.patient_id
       WHERE cr.id = $1 AND p.clinic_id = $2`,
      [consent_id, me.clinic_id]
    )
    if (!consent) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '' || (scope && !(await patientInScope(consent.patient_id, scope)))) {
      return res.status(404).json({ error: 'Consentimiento no encontrado' })
    }

    const device = await queryOne(
      `SELECT id FROM signing_devices WHERE clinic_id = $1 AND revoked_at IS NULL LIMIT 1`,
      [me.clinic_id]
    )
    if (!device) return res.status(400).json({ error: 'No hay ninguna tablet de firma vinculada a esta clínica. Ve a Configuración → Dispositivos de firma.' })

    const data = await queryOne(
      `INSERT INTO consent_signing_handoffs (clinic_id, consent_id, created_by) VALUES ($1,$2,$3) RETURNING *`,
      [me.clinic_id, consent_id, userId]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/consent-handoff/:consentId — desktop polls this to know when the
// tablet has finished (or the consent got signed some other way meanwhile).
router.get('/:consentId', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const me = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })

    const handoff = await queryOne<{ status: string }>(
      `SELECT status FROM consent_signing_handoffs WHERE consent_id = $1 AND clinic_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.consentId, me.clinic_id]
    )
    if (!handoff) return res.status(404).json({ error: 'Sin envío a tablet para este consentimiento' })

    const consent = await queryOne<{ status: string }>(
      'SELECT status FROM consent_records WHERE id = $1', [req.params.consentId]
    )
    return res.json({ handoffStatus: handoff.status, consentStatus: consent?.status ?? null })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
