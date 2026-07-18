import { query, queryOne, withTransaction } from './db'
import { computeRecordHash } from './invoiceHash'
import { buildQrContent } from './invoiceQr'
import { submitToAeat } from './aeatSubmission'

export interface CreateInvoiceInput {
  clinicId: string
  userId: string
  patientId: string | null
  billingClientId: string | null
  recipientType: 'paciente' | 'cliente' | 'manual'
  taxpayerType: 'empresa' | 'autonomo'
  recipientName: string
  recipientNif: string
  recipientAddress: string | null
  concept: string
  baseAmount: number
  vatRate: number
  series: string
  invoiceKind: 'ordinaria' | 'rectificativa' | 'abono'
  rectifiesInvoiceId: string | null
}

// Lógica de creación de una factura compartida por POST /invoices (factura
// ordinaria) y por las rectificativas/abonos (POST /:id/rectificar,
// /:id/abonar) — ambas son, técnicamente, una factura nueva con su propia
// numeración y su propio registro de hash encadenado; lo único que cambia
// es invoice_kind y rectifies_invoice_id. Nunca actualiza una factura ya
// existente: siempre INSERT de una fila nueva en invoices.
export async function createInvoiceRecord(input: CreateInvoiceInput) {
  const clinic = await queryOne<{ name: string; legal_name: string | null; tax_id: string | null }>(
    'SELECT name, legal_name, tax_id FROM clinics WHERE id = $1', [input.clinicId]
  )
  if (!clinic?.tax_id) {
    throw Object.assign(new Error('La clínica no tiene NIF configurado — añádelo en Configuración > Clínica antes de facturar'), { status: 400 })
  }
  const issuerName = clinic.legal_name || clinic.name
  const issuerNif = clinic.tax_id

  const vatAmount = Math.round(input.baseAmount * input.vatRate) / 100
  const totalAmount = Math.round((input.baseAmount + vatAmount) * 100) / 100
  const issueDateIso = new Date().toISOString()

  const invoice = await withTransaction(async client => {
    // Serializa TODA alta/anulación/corrección de esta clínica: la cadena
    // de hashes es única por clínica, así que dos escrituras concurrentes
    // no pueden leer el mismo "último hash" y bifurcar la cadena.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.clinicId])

    // El número de partida de cada serie es configurable (por defecto 1,
    // ver invoice_series y PUT /invoices/series/:series) — aquí solo se
    // consume e incrementa de forma atómica bajo el lock de arriba, nunca
    // se recalcula por COUNT (eso rompería la correlatividad si alguna
    // factura se anula/rectifica más adelante).
    await client.query(
      `INSERT INTO invoice_series (clinic_id, series, next_number)
       VALUES ($1, $2, 1)
       ON CONFLICT (clinic_id, series) DO NOTHING`,
      [input.clinicId, input.series]
    )
    const { rows: seriesRows } = await client.query(
      `UPDATE invoice_series SET next_number = next_number + 1, updated_at = NOW()
       WHERE clinic_id = $1 AND series = $2
       RETURNING next_number - 1 AS seq`,
      [input.clinicId, input.series]
    )
    const seq = Number(seriesRows[0].seq)
    const invoiceNumber = `${input.series}-${String(seq).padStart(4, '0')}`

    const { rows: invRows } = await client.query(
      `INSERT INTO invoices (
         clinic_id, patient_id, billing_client_id, recipient_type, series, invoice_number, issue_date, taxpayer_type,
         issuer_name, issuer_nif, recipient_name, recipient_nif, recipient_address,
         concept, base_amount, vat_rate, vat_amount, total_amount, created_by,
         invoice_kind, rectifies_invoice_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [
        input.clinicId, input.patientId, input.billingClientId, input.recipientType, input.series, invoiceNumber, issueDateIso, input.taxpayerType,
        issuerName, issuerNif, input.recipientName, input.recipientNif, input.recipientAddress,
        input.concept, input.baseAmount, input.vatRate, vatAmount, totalAmount, input.userId,
        input.invoiceKind, input.rectifiesInvoiceId,
      ]
    )
    const inv = invRows[0]

    const { rows: prevRows } = await client.query(
      `SELECT record_hash FROM invoice_records WHERE clinic_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [input.clinicId]
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
      [inv.id, input.clinicId, previousHash, recordHash, qrContent, aeatResult.sentAt, aeatResult.status, JSON.stringify(aeatResult.raw), recordTimestamp]
    )
    await client.query(
      `INSERT INTO invoice_events (invoice_id, clinic_id, event_type, description) VALUES ($1,$2,'creacion',$3)`,
      [inv.id, input.clinicId, `Factura ${invoiceNumber} emitida`]
    )
    await client.query(
      `INSERT INTO invoice_events (invoice_id, clinic_id, event_type, description) VALUES ($1,$2,'envio_aeat',$3)`,
      [inv.id, input.clinicId, `Estado del envío a la AEAT: ${aeatResult.status}`]
    )
    return inv
  })

  invoice.records = await query('SELECT * FROM invoice_records WHERE invoice_id = $1 ORDER BY created_at ASC', [invoice.id])
  return invoice
}
