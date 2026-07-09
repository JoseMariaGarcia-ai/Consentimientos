import { Router } from 'express'
import { query, queryOne, withTransaction } from '../lib/db'
import { computeRecordHash } from '../lib/invoiceHash'
import { buildQrContent } from '../lib/invoiceQr'
import { submitToAeat } from '../lib/aeatSubmission'
import { verifyClinicChain } from '../lib/invoiceIntegrity'

const router = Router()

const VAT_RATES = [21, 10, 4, 0]

async function getClinicId(userId: string): Promise<string | null> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  return row?.clinic_id ?? null
}

async function belongsToClinic(table: string, id: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1 AND clinic_id = $2`, [id, clinicId])
  return !!row
}

async function loadRecords(invoiceId: string) {
  return query('SELECT * FROM invoice_records WHERE invoice_id = $1 ORDER BY created_at ASC', [invoiceId])
}

// GET /api/invoices?date_from&date_to&patient_id&status&series&q
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { date_from, date_to, patient_id, status, series, q } = req.query
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.json([])

    let sql = `
      SELECT i.*, row_to_json(p) AS patient,
        (SELECT r.aeat_response_status FROM invoice_records r
         WHERE r.invoice_id = i.id AND r.record_type = 'alta' LIMIT 1) AS aeat_status
      FROM invoices i
      LEFT JOIN patients p ON p.id = i.patient_id
      WHERE i.clinic_id = $1
    `
    const params: any[] = [clinicId]
    if (date_from) { params.push(date_from);  sql += ` AND i.issue_date >= $${params.length}` }
    if (date_to)   { params.push(date_to);    sql += ` AND i.issue_date < $${params.length}::date + INTERVAL '1 day'` }
    if (patient_id){ params.push(patient_id); sql += ` AND i.patient_id = $${params.length}` }
    if (status)    { params.push(status);     sql += ` AND i.status = $${params.length}` }
    if (series)    { params.push(series);     sql += ` AND i.series = $${params.length}` }
    if (q)         { params.push(`%${q}%`);   sql += ` AND (i.recipient_name ILIKE $${params.length} OR i.invoice_number ILIKE $${params.length})` }
    sql += ' ORDER BY i.issue_date DESC, i.created_at DESC'

    const data = await query(sql, params)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Recalcula la cadena de hashes de la clínica del usuario. Se registra en
// invoice_events como máximo una alarma por ejecución (no una por cada
// registro afectado). Montada ANTES de "/:id" para que "integrity" no se
// interprete como un id de factura.
router.get('/integrity/check', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.json({ ok: true, issues: [] })
    const issues = await verifyClinicChain(clinicId)
    if (issues.length > 0) {
      await query(
        `INSERT INTO invoice_events (clinic_id, event_type, description) VALUES ($1,'alarma_integridad',$2)`,
        [clinicId, `Discrepancias detectadas en la cadena de hashes: ${JSON.stringify(issues)}`]
      )
    }
    return res.json({ ok: issues.length === 0, issues })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const invoice = await queryOne<any>(
      `SELECT i.*, row_to_json(p) AS patient FROM invoices i
       LEFT JOIN patients p ON p.id = i.patient_id
       WHERE i.id = $1 AND i.clinic_id = $2`,
      [req.params.id, clinicId]
    )
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' })
    invoice.records = await loadRecords(invoice.id)
    return res.json(invoice)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/invoices — crea la factura y, en la misma transacción, el
// registro de alta encadenado (hash + QR + intento de envío a la AEAT).
router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const {
    patient_id, taxpayer_type, recipient_name, recipient_nif, recipient_address,
    concept, base_amount, vat_rate, series,
  } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    if (patient_id && !(await belongsToClinic('patients', patient_id, clinicId))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    if (!['empresa', 'autonomo'].includes(taxpayer_type)) {
      return res.status(400).json({ error: 'Tipo de contribuyente no válido' })
    }
    const name = String(recipient_name ?? '').trim()
    const nif = String(recipient_nif ?? '').trim()
    const conceptText = String(concept ?? '').trim()
    if (!name) return res.status(400).json({ error: 'El nombre del destinatario es obligatorio' })
    if (!nif) return res.status(400).json({ error: 'El NIF del destinatario es obligatorio' })
    if (!conceptText) return res.status(400).json({ error: 'El concepto es obligatorio' })
    const rate = Number(vat_rate)
    if (!VAT_RATES.includes(rate)) return res.status(400).json({ error: 'Tipo de IVA no válido' })
    const base = Number(base_amount)
    if (!(base > 0)) return res.status(400).json({ error: 'La base imponible debe ser mayor que 0' })
    const invoiceSeries = (String(series ?? 'A').trim().toUpperCase() || 'A').slice(0, 10)

    const clinic = await queryOne<{ name: string; legal_name: string | null; tax_id: string | null }>(
      'SELECT name, legal_name, tax_id FROM clinics WHERE id = $1', [clinicId]
    )
    if (!clinic?.tax_id) {
      return res.status(400).json({ error: 'La clínica no tiene NIF configurado — añádelo en Configuración > Clínica antes de facturar' })
    }
    const issuerName = clinic.legal_name || clinic.name
    const issuerNif = clinic.tax_id

    const vatAmount = Math.round(base * rate) / 100
    const totalAmount = Math.round((base + vatAmount) * 100) / 100
    const issueDateIso = new Date().toISOString()

    const invoice = await withTransaction(async client => {
      // Serializa TODA alta/anulación de esta clínica (no solo por serie):
      // la cadena de hashes es única por clínica, así que dos altas
      // concurrentes en series distintas no pueden leer el mismo
      // "último hash" y bifurcar la cadena. Como efecto secundario también
      // hace correlativa sin huecos la numeración por serie.
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [clinicId])

      const { rows: countRows } = await client.query(
        'SELECT COUNT(*) FROM invoices WHERE clinic_id = $1 AND series = $2', [clinicId, invoiceSeries]
      )
      const seq = Number(countRows[0]?.count ?? 0) + 1
      const invoiceNumber = `${invoiceSeries}-${String(seq).padStart(4, '0')}`

      const { rows: invRows } = await client.query(
        `INSERT INTO invoices (
           clinic_id, patient_id, series, invoice_number, issue_date, taxpayer_type,
           issuer_name, issuer_nif, recipient_name, recipient_nif, recipient_address,
           concept, base_amount, vat_rate, vat_amount, total_amount, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
          clinicId, patient_id ?? null, invoiceSeries, invoiceNumber, issueDateIso, taxpayer_type,
          issuerName, issuerNif, name, nif, recipient_address ?? null,
          conceptText, base, rate, vatAmount, totalAmount, userId,
        ]
      )
      const inv = invRows[0]

      const { rows: prevRows } = await client.query(
        `SELECT record_hash FROM invoice_records WHERE clinic_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [clinicId]
      )
      const previousHash: string | null = prevRows[0]?.record_hash ?? null
      const recordTimestamp = new Date().toISOString()
      const recordHash = computeRecordHash({
        nifEmisor: issuerNif,
        invoiceNumber,
        issueDate: issueDateIso,
        recordType: 'alta',
        totalAmount,
        previousHash,
        timestamp: recordTimestamp,
      })
      const qrContent = buildQrContent({
        nifEmisor: issuerNif, invoiceNumber, issueDate: issueDateIso.slice(0, 10), totalAmount,
      })
      const aeatResult = await submitToAeat({
        nifEmisor: issuerNif, invoiceNumber, issueDate: issueDateIso, recordType: 'alta',
        totalAmount, recordHash, previousHash,
      })

      await client.query(
        `INSERT INTO invoice_records (
           invoice_id, clinic_id, record_type, previous_hash, record_hash, qr_content,
           aeat_sent_at, aeat_response_status, aeat_response_raw, created_at
         ) VALUES ($1,$2,'alta',$3,$4,$5,$6,$7,$8,$9)`,
        [inv.id, clinicId, previousHash, recordHash, qrContent, aeatResult.sentAt, aeatResult.status, JSON.stringify(aeatResult.raw), recordTimestamp]
      )
      await client.query(
        `INSERT INTO invoice_events (invoice_id, clinic_id, event_type, description) VALUES ($1,$2,'creacion',$3)`,
        [inv.id, clinicId, `Factura ${invoiceNumber} emitida`]
      )
      await client.query(
        `INSERT INTO invoice_events (invoice_id, clinic_id, event_type, description) VALUES ($1,$2,'envio_aeat',$3)`,
        [inv.id, clinicId, `Estado del envío a la AEAT: ${aeatResult.status}`]
      )
      return inv
    })

    invoice.records = await loadRecords(invoice.id)
    return res.status(201).json(invoice)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// POST /api/invoices/:id/cancel — anula mediante un NUEVO registro
// encadenado de tipo 'anulacion'. La factura original nunca se borra ni se
// actualiza en sus campos fiscales; solo cambia su columna status.
router.post('/:id/cancel', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const invoice = await queryOne<any>('SELECT * FROM invoices WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' })
    if (invoice.status === 'anulada') return res.status(400).json({ error: 'La factura ya está anulada' })

    await withTransaction(async client => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [clinicId])
      const { rows: prevRows } = await client.query(
        `SELECT record_hash FROM invoice_records WHERE clinic_id = $1 ORDER BY created_at DESC LIMIT 1`, [clinicId]
      )
      const previousHash: string | null = prevRows[0]?.record_hash ?? null
      const issueDateIso = new Date(invoice.issue_date).toISOString()
      const recordTimestamp = new Date().toISOString()
      const recordHash = computeRecordHash({
        nifEmisor: invoice.issuer_nif,
        invoiceNumber: invoice.invoice_number,
        issueDate: issueDateIso,
        recordType: 'anulacion',
        totalAmount: Number(invoice.total_amount),
        previousHash,
        timestamp: recordTimestamp,
      })
      const qrContent = buildQrContent({
        nifEmisor: invoice.issuer_nif, invoiceNumber: invoice.invoice_number,
        issueDate: issueDateIso.slice(0, 10), totalAmount: Number(invoice.total_amount),
      })
      const aeatResult = await submitToAeat({
        nifEmisor: invoice.issuer_nif, invoiceNumber: invoice.invoice_number,
        issueDate: issueDateIso, recordType: 'anulacion',
        totalAmount: Number(invoice.total_amount), recordHash, previousHash,
      })
      await client.query(
        `INSERT INTO invoice_records (
           invoice_id, clinic_id, record_type, previous_hash, record_hash, qr_content,
           aeat_sent_at, aeat_response_status, aeat_response_raw, created_at
         ) VALUES ($1,$2,'anulacion',$3,$4,$5,$6,$7,$8,$9)`,
        [invoice.id, clinicId, previousHash, recordHash, qrContent, aeatResult.sentAt, aeatResult.status, JSON.stringify(aeatResult.raw), recordTimestamp]
      )
      await client.query(`UPDATE invoices SET status = 'anulada' WHERE id = $1`, [invoice.id])
      await client.query(
        `INSERT INTO invoice_events (invoice_id, clinic_id, event_type, description) VALUES ($1,$2,'anulacion',$3)`,
        [invoice.id, clinicId, `Factura ${invoice.invoice_number} anulada`]
      )
    })

    const updated = await queryOne('SELECT * FROM invoices WHERE id = $1', [invoice.id])
    return res.json(updated)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

export default router
