import { Router } from 'express'
import crypto from 'crypto'
import { query, queryOne } from '../lib/db'
import { deductCredit } from '../lib/credits'
import { requireSuperAdmin } from '../middleware/auth'

const router = Router()

router.get('/templates', async (_req, res) => {
  try {
    const data = await query(
      `SELECT id, treatment_type AS "treatmentType", category, extra_categories AS "extraCategories", content_json AS "contentJson", legal_clauses_json AS "legalClausesJson"
       FROM consent_templates WHERE is_active = true ORDER BY category ASC, treatment_type ASC`
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Solo superadmin: las plantillas son globales (clinic_id NULL, compartidas
// por todas las clínicas), así que editarlas afecta a toda la plataforma.
router.put('/templates/:id', requireSuperAdmin, async (req, res) => {
  try {
    const b = req.body
    const data = await queryOne(
      `UPDATE consent_templates
       SET treatment_type = $1, category = $2, extra_categories = $3, content_json = $4, legal_clauses_json = $5
       WHERE id = $6
       RETURNING id, treatment_type AS "treatmentType", category, extra_categories AS "extraCategories", content_json AS "contentJson", legal_clauses_json AS "legalClausesJson"`,
      [b.treatmentType, b.category, b.extraCategories ?? [], JSON.stringify(b.contentJson ?? {}), JSON.stringify(b.legalClausesJson ?? {}), req.params.id]
    )
    if (!data) return res.status(404).json({ error: 'Plantilla no encontrada' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/consents?patient_id=&type=&status=
// type=toxina restricts to templates whose treatment_type mentions toxin/botulinum
// treatments (used to link a toxin control record to its signed consent).
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id, type, status } = req.query
  try {
    let sql = `
      SELECT cr.*, row_to_json(p) AS patient, row_to_json(d) AS doctor, row_to_json(t) AS template
      FROM consent_records cr
      JOIN patients p ON p.id = cr.patient_id
      LEFT JOIN doctors d ON d.id = cr.doctor_id
      LEFT JOIN consent_templates t ON t.id = cr.template_id
      WHERE p.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $1)
    `
    const params: any[] = [userId]
    if (patient_id) { params.push(patient_id); sql += ` AND cr.patient_id = $${params.length}` }
    if (status)     { params.push(status);     sql += ` AND cr.status = $${params.length}` }
    if (type === 'toxina') { sql += ` AND (t.treatment_type ILIKE '%toxina%' OR t.treatment_type ILIKE '%botul%')` }
    sql += ' ORDER BY cr.created_at DESC'

    const data = await query(sql, params)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const data = await queryOne(
      `SELECT cr.*, row_to_json(p) AS patient, row_to_json(d) AS doctor, row_to_json(t) AS template
       FROM consent_records cr
       JOIN patients p ON p.id = cr.patient_id
       LEFT JOIN doctors d ON d.id = cr.doctor_id
       LEFT JOIN consent_templates t ON t.id = cr.template_id
       WHERE cr.id = $1 AND p.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)`,
      [req.params.id, userId]
    )
    if (!data) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  try {
    const b = req.body
    const { userId } = (req as any).user
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinicId = clinicRow?.clinic_id
    const patientId = b.patient_id ?? b.patientId
    const ownsPatient = await queryOne('SELECT id FROM patients WHERE id = $1 AND clinic_id = $2', [patientId, clinicId])
    if (!ownsPatient) return res.status(404).json({ error: 'Paciente no encontrado' })
    await deductCredit(clinicId!, 'consents_available')
    const data = await queryOne(
      `INSERT INTO consent_records (patient_id, doctor_id, template_id, language, jurisdiction, status)
       VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
      [
        patientId,
        b.doctor_id  ?? b.doctorId,
        b.template_id ?? b.templateId,
        b.language ?? 'es-ES',
        b.jurisdiction ?? null,
      ]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status((err as any).status ?? 500).json({ error: err.message }) }
})

// Revoca un consentimiento firmado. No se borra ni se modifica el documento
// firmado original (firma, hash, PDF) — solo se marca como revocado con
// motivo y autoría, preservando el valor probatorio del consentimiento.
router.post('/:id/revoke', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const reason = String(req.body?.reason ?? '').trim()
    if (!reason) return res.status(400).json({ error: 'Debes indicar el motivo de la revocación' })
    const current = await queryOne<{ status: string; document_hash: string | null }>(
      `SELECT cr.status, cr.document_hash FROM consent_records cr
       JOIN patients p ON p.id = cr.patient_id
       WHERE cr.id = $1 AND p.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)`,
      [req.params.id, userId]
    )
    if (!current) return res.status(404).json({ error: 'Consentimiento no encontrado' })
    if (current.status !== 'signed') {
      return res.status(400).json({ error: 'Solo se pueden revocar consentimientos firmados' })
    }
    // Huella de la revocación: encadena el hash del documento firmado original
    // con los datos de la revocación, para poder detectar si revoked_at o
    // revocation_reason se alteran después de guardarse.
    const revokedAt = new Date().toISOString()
    const revocationHash = crypto
      .createHash('sha256')
      .update(`${req.params.id}|${current.document_hash ?? ''}|${revokedAt}|${userId}|${reason}`)
      .digest('hex')
    const data = await queryOne(
      `UPDATE consent_records
       SET status = 'revoked', revoked_at = $1, revoked_by = $2, revocation_reason = $3, revocation_hash = $4
       WHERE id = $5
       RETURNING *`,
      [revokedAt, userId, reason, revocationHash, req.params.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Solo se permite eliminar consentimientos que nunca llegaron a firmarse
// (pending/expired). Un consentimiento firmado es un documento legal: para
// invalidarlo se usa /revoke, que conserva el registro y su trazabilidad.
router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const data = await queryOne(
      `DELETE FROM consent_records cr
       USING patients p
       WHERE cr.id = $1 AND cr.patient_id = p.id AND p.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)
         AND cr.status <> 'signed' AND cr.status <> 'revoked'
       RETURNING cr.id`,
      [req.params.id, userId]
    )
    if (!data) {
      const exists = await queryOne(
        `SELECT cr.status FROM consent_records cr
         JOIN patients p ON p.id = cr.patient_id
         WHERE cr.id = $1 AND p.clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2)`,
        [req.params.id, userId]
      )
      if (exists) return res.status(400).json({ error: 'No se puede eliminar un consentimiento firmado o revocado — usa la opción de revocar' })
      return res.status(404).json({ error: 'Consentimiento no encontrado' })
    }
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
