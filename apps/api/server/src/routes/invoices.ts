import { Router } from 'express'
import { query, queryOne, withTransaction } from '../lib/db'
import { computeRecordHash } from '../lib/invoiceHash'
import { buildQrContent } from '../lib/invoiceQr'
import { submitToAeat } from '../lib/aeatSubmission'
import { verifyClinicChain } from '../lib/invoiceIntegrity'
import { sendInvoiceEmail } from '../lib/invoiceEmail'
import { createInvoiceRecord } from '../lib/invoiceCreation'
import { recalculatePaymentStatus } from '../lib/invoicePayments'

const PAYMENT_METHODS = ['efectivo', 'transferencia', 'bizum', 'tarjeta', 'stripe', 'otro']

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

// GET /api/invoices?date_from&date_to&patient_id&status&series&q&recipient_type
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { date_from, date_to, patient_id, status, series, q, recipient_type, payment_status } = req.query
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.json([])

    let sql = `
      SELECT i.*, row_to_json(p) AS patient, row_to_json(bc) AS billing_client,
        (SELECT r.aeat_response_status FROM invoice_records r
         WHERE r.invoice_id = i.id AND r.record_type = 'alta' LIMIT 1) AS aeat_status,
        (SELECT r.aeat_sent_at FROM invoice_records r
         WHERE r.invoice_id = i.id AND r.record_type = 'alta' LIMIT 1) AS aeat_sent_at
      FROM invoices i
      LEFT JOIN patients p ON p.id = i.patient_id
      LEFT JOIN billing_clients bc ON bc.id = i.billing_client_id
      WHERE i.clinic_id = $1
    `
    const params: any[] = [clinicId]
    if (date_from) { params.push(date_from);  sql += ` AND i.issue_date >= $${params.length}` }
    if (date_to)   { params.push(date_to);    sql += ` AND i.issue_date < $${params.length}::date + INTERVAL '1 day'` }
    if (patient_id){ params.push(patient_id); sql += ` AND i.patient_id = $${params.length}` }
    if (status)    { params.push(status);     sql += ` AND i.status = $${params.length}` }
    if (series)    { params.push(series);     sql += ` AND i.series = $${params.length}` }
    if (recipient_type) { params.push(recipient_type); sql += ` AND i.recipient_type = $${params.length}` }
    if (payment_status) { params.push(payment_status); sql += ` AND i.payment_status = $${params.length}` }
    if (q)         { params.push(`%${q}%`);   sql += ` AND (i.recipient_name ILIKE $${params.length} OR i.invoice_number ILIKE $${params.length} OR i.recipient_nif ILIKE $${params.length})` }
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
      `SELECT i.*, row_to_json(p) AS patient, row_to_json(bc) AS billing_client,
        (SELECT row_to_json(o) FROM (SELECT invoice_number, issue_date FROM invoices WHERE id = i.rectifies_invoice_id) o) AS rectified_invoice
       FROM invoices i
       LEFT JOIN patients p ON p.id = i.patient_id
       LEFT JOIN billing_clients bc ON bc.id = i.billing_client_id
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
    patient_id, billing_client_id, taxpayer_type, recipient_name, recipient_nif, recipient_address,
    concept, base_amount, vat_rate, series,
  } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    if (patient_id && billing_client_id) {
      return res.status(400).json({ error: 'Una factura no puede tener paciente y cliente a la vez' })
    }
    if (patient_id && !(await belongsToClinic('patients', patient_id, clinicId))) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }
    let billingClient: { full_name: string; tax_id: string; address: string; email: string | null } | null = null
    if (billing_client_id) {
      billingClient = await queryOne(
        'SELECT full_name, tax_id, address, email FROM billing_clients WHERE id = $1 AND clinic_id = $2',
        [billing_client_id, clinicId]
      )
      if (!billingClient) return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    const recipientType: 'paciente' | 'cliente' | 'manual' = billing_client_id ? 'cliente' : patient_id ? 'paciente' : 'manual'

    if (!['empresa', 'autonomo'].includes(taxpayer_type)) {
      return res.status(400).json({ error: 'Tipo de contribuyente no válido' })
    }
    // Si se factura a un cliente guardado, sus datos fiscales tienen
    // prioridad sobre lo que venga en el cuerpo (evita que un valor manual
    // desincronizado en el formulario contradiga el registro real del
    // cliente) — igual que el emisor siempre se toma de la clínica, nunca
    // del formulario.
    const name = String(billingClient?.full_name ?? recipient_name ?? '').trim()
    const nif = String(billingClient?.tax_id ?? recipient_nif ?? '').trim()
    const address = billingClient?.address ?? recipient_address ?? null
    const conceptText = String(concept ?? '').trim()
    if (!name) return res.status(400).json({ error: 'El nombre del destinatario es obligatorio' })
    if (!nif) return res.status(400).json({ error: 'El NIF del destinatario es obligatorio' })
    if (!conceptText) return res.status(400).json({ error: 'El concepto es obligatorio' })
    const rate = Number(vat_rate)
    if (!VAT_RATES.includes(rate)) return res.status(400).json({ error: 'Tipo de IVA no válido' })
    const base = Number(base_amount)
    if (!(base > 0)) return res.status(400).json({ error: 'La base imponible debe ser mayor que 0' })
    const invoiceSeries = (String(series ?? 'A').trim().toUpperCase() || 'A').slice(0, 10)

    const invoice = await createInvoiceRecord({
      clinicId, userId,
      patientId: patient_id ?? null, billingClientId: billing_client_id ?? null, recipientType,
      taxpayerType: taxpayer_type, recipientName: name, recipientNif: nif, recipientAddress: address,
      concept: conceptText, baseAmount: base, vatRate: rate, series: invoiceSeries,
      invoiceKind: 'ordinaria', rectifiesInvoiceId: null,
    })
    return res.status(201).json(invoice)
  } catch (err: any) { return res.status(err.status ?? 400).json({ error: err.message }) }
})

// POST /api/invoices/:id/send-email — { pdfBase64, email? } el PDF se
// genera en el cliente (igual que en budgets.ts) y se sube en base64; email
// permite sobrescribir puntualmente el destinatario para este envío sin
// modificar el dato guardado en el paciente o en el billing_client.
router.post('/:id/send-email', async (req, res) => {
  const { userId } = (req as any).user
  const { pdfBase64, email } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    if (!pdfBase64) return res.status(400).json({ error: 'pdfBase64 requerido' })
    const invoice = await queryOne<{ id: string }>('SELECT id FROM invoices WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' })

    const pdfBuffer = Buffer.from(pdfBase64, 'base64')
    const result = await sendInvoiceEmail({ invoiceId: invoice.id, clinicId, pdfBuffer, overrideEmail: email || null })
    if (!result.email) {
      return res.status(400).json({ error: 'No hay ningún email al que enviar la factura — indícalo manualmente' })
    }
    if (!result.sent) {
      return res.status(502).json({ error: `No se pudo enviar el email a ${result.email} — inténtalo de nuevo` })
    }

    await query(
      `INSERT INTO invoice_events (invoice_id, clinic_id, event_type, description) VALUES ($1,$2,'envio_manual_email',$3)`,
      [invoice.id, clinicId, `Factura reenviada manualmente a ${result.email}`]
    )
    return res.json({ sent: true, email: result.email })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/invoices/:id/cancel — { reason } anula mediante un NUEVO
// registro encadenado de tipo 'anulacion'. La factura original nunca se
// borra ni se actualiza en sus campos fiscales; solo cambia su columna
// status. El motivo es obligatorio y queda registrado en
// invoice_corrections para trazabilidad/inspección.
router.post('/:id/cancel', async (req, res) => {
  const { userId } = (req as any).user
  const reason = String(req.body?.reason ?? '').trim()
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    if (!reason) return res.status(400).json({ error: 'El motivo de la anulación es obligatorio' })
    const invoice = await queryOne<any>('SELECT * FROM invoices WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' })
    if (invoice.status !== 'emitida') return res.status(400).json({ error: 'Solo se puede anular una factura en estado emitida' })

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
        [invoice.id, clinicId, `Factura ${invoice.invoice_number} anulada: ${reason}`]
      )
      await client.query(
        `INSERT INTO invoice_corrections (clinic_id, original_invoice_id, correction_invoice_id, correction_type, reason, amount, requested_by)
         VALUES ($1,$2,NULL,'anulacion',$3,NULL,$4)`,
        [clinicId, invoice.id, reason, userId]
      )
    })

    const updated = await queryOne('SELECT * FROM invoices WHERE id = $1', [invoice.id])
    return res.json(updated)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// Compartida por /:id/rectificar y /:id/abonar — ambas generan una NUEVA
// factura vinculada a la original (nunca modifican la original), difieren
// solo en invoice_kind y en cómo se calcula el importe.
async function createCorrection(req: any, res: any, kind: 'rectificativa' | 'abono') {
  const { userId } = req.user
  const reason = String(req.body?.reason ?? '').trim()
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    if (!reason) return res.status(400).json({ error: 'El motivo es obligatorio' })
    const original = await queryOne<any>('SELECT * FROM invoices WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!original) return res.status(404).json({ error: 'Factura no encontrada' })
    if (original.status !== 'emitida') {
      return res.status(400).json({ error: 'Solo se puede corregir una factura en estado emitida — corrige la factura generada por la corrección anterior, no esta' })
    }

    let base: number
    if (kind === 'abono') {
      const full = !!req.body?.full
      const amountInput = Number(req.body?.amount)
      if (!full && !(amountInput > 0)) return res.status(400).json({ error: 'Indica el importe a abonar (o marca abono total)' })
      base = full ? -Number(original.base_amount) : -Math.abs(amountInput)
    } else {
      const amountInput = Number(req.body?.amount)
      if (!amountInput || amountInput === 0) return res.status(400).json({ error: 'Indica el importe de la rectificación (puede ser positivo o negativo)' })
      base = amountInput
    }

    const concept = String(req.body?.concept ?? '').trim() ||
      (kind === 'abono' ? `Abono de la factura ${original.invoice_number}: ${reason}` : `Rectificación de la factura ${original.invoice_number}: ${reason}`)

    const correctionInvoice = await createInvoiceRecord({
      clinicId, userId,
      patientId: original.patient_id, billingClientId: original.billing_client_id, recipientType: original.recipient_type,
      taxpayerType: original.taxpayer_type, recipientName: original.recipient_name, recipientNif: original.recipient_nif,
      recipientAddress: original.recipient_address, concept, baseAmount: base, vatRate: Number(original.vat_rate),
      series: original.series, invoiceKind: kind, rectifiesInvoiceId: original.id,
    })

    await query(`UPDATE invoices SET status = 'rectificada' WHERE id = $1`, [original.id])
    await query(
      `INSERT INTO invoice_events (invoice_id, clinic_id, event_type, description) VALUES ($1,$2,'correccion',$3)`,
      [original.id, clinicId, `Factura ${original.invoice_number} rectificada por ${correctionInvoice.invoice_number} (${kind}): ${reason}`]
    )
    await query(
      `INSERT INTO invoice_corrections (clinic_id, original_invoice_id, correction_invoice_id, correction_type, reason, amount, requested_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [clinicId, original.id, correctionInvoice.id, kind, reason, base, userId]
    )

    return res.status(201).json(correctionInvoice)
  } catch (err: any) { return res.status(err.status ?? 400).json({ error: err.message }) }
}

// POST /api/invoices/:id/rectificar — { reason, amount } nueva factura
// rectificativa (importe puede ser positivo o negativo).
router.post('/:id/rectificar', (req, res) => createCorrection(req, res, 'rectificativa'))

// POST /api/invoices/:id/abonar — { reason, amount?, full? } nueva factura
// de abono (importe siempre negativo; full=true abona el importe total).
router.post('/:id/abonar', (req, res) => createCorrection(req, res, 'abono'))

// GET /api/invoices/:id/corrections — historial de correcciones de una
// factura (para enlazar desde el detalle a la anulación/rectificativa/abono
// generada).
router.get('/:id/corrections', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.json([])
    const invoice = await queryOne<{ id: string }>('SELECT id FROM invoices WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' })
    const data = await query(
      `SELECT c.*, row_to_json(ci) AS correction_invoice
       FROM invoice_corrections c
       LEFT JOIN invoices ci ON ci.id = c.correction_invoice_id
       WHERE c.original_invoice_id = $1
       ORDER BY c.created_at ASC`,
      [invoice.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/invoices/:id/payments — listado de pagos registrados
router.get('/:id/payments', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.json([])
    const invoice = await queryOne<{ id: string }>('SELECT id FROM invoices WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' })
    const data = await query(
      'SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC, created_at DESC', [invoice.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/invoices/:id/payments — { amount, payment_method, payment_date, notes? }
// registra un cobro (total o parcial) y recalcula payment_status.
router.post('/:id/payments', async (req, res) => {
  const { userId } = (req as any).user
  const { amount, payment_method, payment_date, notes } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const invoice = await queryOne<{ id: string }>('SELECT id FROM invoices WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' })
    const amt = Number(amount)
    if (!(amt > 0)) return res.status(400).json({ error: 'El importe del cobro debe ser mayor que 0' })
    if (!PAYMENT_METHODS.includes(payment_method)) return res.status(400).json({ error: 'Forma de pago no válida' })
    const date = payment_date ? String(payment_date) : new Date().toISOString().slice(0, 10)

    const payment = await queryOne(
      `INSERT INTO invoice_payments (clinic_id, invoice_id, amount, payment_method, payment_date, notes, registered_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [clinicId, invoice.id, amt, payment_method, date, notes || null, userId]
    )
    const payment_status = await recalculatePaymentStatus(invoice.id)
    return res.status(201).json({ payment, payment_status })
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// DELETE /api/invoices/:id/payments/:paymentId — elimina un pago registrado
// por error y recalcula payment_status.
router.delete('/:id/payments/:paymentId', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const invoice = await queryOne<{ id: string }>('SELECT id FROM invoices WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' })
    const deleted = await queryOne<{ id: string }>(
      'DELETE FROM invoice_payments WHERE id = $1 AND invoice_id = $2 RETURNING id', [req.params.paymentId, invoice.id]
    )
    if (!deleted) return res.status(404).json({ error: 'Pago no encontrado' })
    const payment_status = await recalculatePaymentStatus(invoice.id)
    return res.json({ deleted: true, payment_status })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
