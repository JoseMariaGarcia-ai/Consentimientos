import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

async function getOrCreateCredits(clinicId: string) {
  let row = await queryOne<any>('SELECT * FROM clinic_credits WHERE clinic_id = $1', [clinicId])
  if (!row) {
    row = await queryOne(
      `INSERT INTO clinic_credits (clinic_id, consents_available, clinical_records_available, photo_sessions_available)
       VALUES ($1, 10, 10, 10) ON CONFLICT (clinic_id) DO UPDATE SET updated_at=NOW() RETURNING *`,
      [clinicId]
    )
  }
  return row
}

// GET /api/credits — current credits for the clinic
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinic = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' })
    const credits = await getOrCreateCredits(clinic.clinic_id)
    return res.json(credits)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/credits/topup — admin adds credits
router.post('/topup', async (req, res) => {
  const { userId, role } = (req as any).user
  if (role !== 'admin' && role !== 'superadmin') return res.status(403).json({ error: 'Solo administradores' })
  const { consents = 0, clinical_records = 0, photo_sessions = 0, clinic_id } = req.body
  try {
    const targetClinicId = clinic_id ?? (await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId]))?.clinic_id
    if (!targetClinicId) return res.status(400).json({ error: 'clinic_id requerido' })

    await getOrCreateCredits(targetClinicId)
    const updated = await queryOne(
      `UPDATE clinic_credits SET
         consents_available         = consents_available + $1,
         clinical_records_available = clinical_records_available + $2,
         photo_sessions_available   = photo_sessions_available + $3,
         updated_at = NOW()
       WHERE clinic_id = $4 RETURNING *`,
      [consents, clinical_records, photo_sessions, targetClinicId]
    )
    return res.json(updated)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/credits/set — admin sets absolute values
router.post('/set', async (req, res) => {
  const { userId, role } = (req as any).user
  if (role !== 'admin' && role !== 'superadmin') return res.status(403).json({ error: 'Solo administradores' })
  const { consents, clinical_records, photo_sessions, clinic_id } = req.body
  try {
    const targetClinicId = clinic_id ?? (await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId]))?.clinic_id
    if (!targetClinicId) return res.status(400).json({ error: 'clinic_id requerido' })

    await getOrCreateCredits(targetClinicId)
    const updated = await queryOne(
      `UPDATE clinic_credits SET
         consents_available         = COALESCE($1, consents_available),
         clinical_records_available = COALESCE($2, clinical_records_available),
         photo_sessions_available   = COALESCE($3, photo_sessions_available),
         updated_at = NOW()
       WHERE clinic_id = $4 RETURNING *`,
      [consents ?? null, clinical_records ?? null, photo_sessions ?? null, targetClinicId]
    )
    return res.json(updated)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export { getOrCreateCredits }
export default router
