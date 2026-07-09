import { query } from './db'
import { computeRecordHash } from './invoiceHash'

export interface IntegrityIssue {
  recordId: string
  invoiceId: string
  reason: 'hash_mismatch' | 'chain_broken'
}

interface RecordRow {
  id: string
  invoice_id: string
  record_type: 'alta' | 'anulacion'
  previous_hash: string | null
  record_hash: string
  created_at: string | Date
  issuer_nif: string
  invoice_number: string
  issue_date: string | Date
  total_amount: string
}

// node-postgres devuelve las columnas timestamptz como objetos Date, no
// como el string ISO original — hay que normalizar antes de recalcular el
// hash, o la comparación fallaría aunque nada se haya alterado.
const toIso = (v: string | Date) => (v instanceof Date ? v.toISOString() : new Date(v).toISOString())

// Recalcula el hash de cada registro de la clínica, en orden cronológico, y
// comprueba dos cosas: que el hash guardado coincide con el que resultaría
// de recalcularlo, y que previous_hash de cada registro coincide con el
// record_hash real del registro inmediatamente anterior — así se detecta
// tanto una alteración de un registro como el borrado de uno intermedio
// (lo segundo rompería el encadenamiento aunque cada hash individual
// siguiera siendo "válido" por sí solo).
export async function verifyClinicChain(clinicId: string): Promise<IntegrityIssue[]> {
  const records = await query<RecordRow>(
    `SELECT r.id, r.invoice_id, r.record_type, r.previous_hash, r.record_hash, r.created_at,
            i.issuer_nif, i.invoice_number, i.issue_date, i.total_amount
     FROM invoice_records r
     JOIN invoices i ON i.id = r.invoice_id
     WHERE r.clinic_id = $1
     ORDER BY r.created_at ASC`,
    [clinicId]
  )

  const issues: IntegrityIssue[] = []
  let expectedPreviousHash: string | null = null

  for (const rec of records) {
    if (rec.previous_hash !== expectedPreviousHash) {
      issues.push({ recordId: rec.id, invoiceId: rec.invoice_id, reason: 'chain_broken' })
    }
    const recalculated = computeRecordHash({
      nifEmisor: rec.issuer_nif,
      invoiceNumber: rec.invoice_number,
      issueDate: toIso(rec.issue_date),
      recordType: rec.record_type,
      totalAmount: Number(rec.total_amount),
      previousHash: rec.previous_hash,
      timestamp: toIso(rec.created_at),
    })
    if (recalculated !== rec.record_hash) {
      issues.push({ recordId: rec.id, invoiceId: rec.invoice_id, reason: 'hash_mismatch' })
    }
    expectedPreviousHash = rec.record_hash
  }

  return issues
}
