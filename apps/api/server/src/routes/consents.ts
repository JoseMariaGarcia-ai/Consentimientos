import { Router } from 'express'
import crypto from 'crypto'
import { query, queryOne } from '../lib/db'
import { deductCredit } from '../lib/credits'
import { requireSuperAdmin } from '../middleware/auth'
import { notifyConsentRevoked } from '../lib/consentRevocationEmail'

const router = Router()

async function belongsToClinic(table: string, id: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1 AND clinic_id = $2`, [id, clinicId])
  return !!row
}

// "isFavorite" refleja los favoritos ("Más usados") de la clínica de QUIEN
// pregunta, no de la plantilla en sí (ver clinic_template_favorites en la
// migración 088) — por eso el LEFT JOIN se ata al clinic_id resuelto del
// usuario autenticado. Un superadmin no pertenece a ninguna clínica
// (clinic_id NULL en app_users), así que para él nunca hay favoritos: es
// el comportamiento correcto, no un caso especial que haya que tratar aparte.
router.get('/templates', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string | null }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const data = await query(
      `SELECT t.id, t.treatment_type AS "treatmentType", t.category, t.extra_categories AS "extraCategories",
              t.content_json AS "contentJson", t.legal_clauses_json AS "legalClausesJson",
              (f.template_id IS NOT NULL) AS "isFavorite"
       FROM consent_templates t
       LEFT JOIN clinic_template_favorites f ON f.template_id = t.id AND f.clinic_id = $1
       WHERE t.is_active = true
       ORDER BY t.category ASC, t.treatment_type ASC`,
      [me?.clinic_id ?? null]
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

// "Más usados" — marcar/desmarcar una plantilla como favorita para la
// clínica del usuario autenticado (cualquier rol de plantilla, no solo
// superadmin: es una preferencia de uso diario, no una edición del
// contenido legal compartido).
router.post('/templates/:id/favorite', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string | null }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.status(400).json({ error: 'Tu usuario no pertenece a ninguna clínica' })
    await query(
      `INSERT INTO clinic_template_favorites (clinic_id, template_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [me.clinic_id, req.params.id]
    )
    return res.json({ ok: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/templates/:id/favorite', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string | null }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.status(400).json({ error: 'Tu usuario no pertenece a ninguna clínica' })
    await query(`DELETE FROM clinic_template_favorites WHERE clinic_id = $1 AND template_id = $2`, [me.clinic_id, req.params.id])
    return res.json({ ok: true })
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
    const doctorId = b.doctor_id ?? b.doctorId
    if (doctorId && !(await belongsToClinic('doctors', doctorId, clinicId!))) {
      return res.status(404).json({ error: 'Doctor no encontrado' })
    }
    await deductCredit(clinicId!, 'consents_available')
    const data = await queryOne(
      `INSERT INTO consent_records (patient_id, doctor_id, template_id, language, jurisdiction, status)
       VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
      [
        patientId,
        doctorId,
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
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinicId = clinicRow?.clinic_id
    const current = await queryOne<{ status: string; document_hash: string | null }>(
      `SELECT cr.status, cr.document_hash FROM consent_records cr
       JOIN patients p ON p.id = cr.patient_id
       WHERE cr.id = $1 AND p.clinic_id = $2`,
      [req.params.id, clinicId]
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
    notifyConsentRevoked(req.params.id, clinicId!).catch(err =>
      console.error(`[consents] fallo notificando revocación ${req.params.id}:`, err.message)
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
