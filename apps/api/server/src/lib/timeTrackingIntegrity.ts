import { query } from './db'
import { computeTimeRecordHash } from './timeTrackingHash'

export interface TimeIntegrityIssue {
  recordId: string
  employeeId: string
  reason: 'hash_mismatch' | 'chain_broken'
}

interface RecordRow {
  id: string
  employee_id: string
  record_type: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa'
  timestamp_utc: string | Date
  latitude: string | null
  longitude: string | null
  previous_hash: string | null
  record_hash: string
}

const toIso = (v: string | Date) => (v instanceof Date ? v.toISOString() : new Date(v).toISOString())

// Recalcula, empleado por empleado, la cadena de hashes de fichajes de la
// clínica. Cada empleado tiene su propia cadena independiente (el
// encadenamiento es por employee_id, no por clínica), así que se agrupan
// los registros por empleado antes de verificar.
export async function verifyClinicTimeChain(clinicId: string): Promise<TimeIntegrityIssue[]> {
  const records = await query<RecordRow>(
    `SELECT id, employee_id, record_type, timestamp_utc, latitude, longitude, previous_hash, record_hash
     FROM time_records
     WHERE clinic_id = $1
     ORDER BY employee_id ASC, timestamp_utc ASC, created_at ASC`,
    [clinicId]
  )

  const issues: TimeIntegrityIssue[] = []
  let currentEmployee: string | null = null
  let expectedPreviousHash: string | null = null

  for (const rec of records) {
    if (rec.employee_id !== currentEmployee) {
      currentEmployee = rec.employee_id
      expectedPreviousHash = null
    }
    if (rec.previous_hash !== expectedPreviousHash) {
      issues.push({ recordId: rec.id, employeeId: rec.employee_id, reason: 'chain_broken' })
    }
    const recalculated = computeTimeRecordHash({
      employeeId: rec.employee_id,
      recordType: rec.record_type,
      timestampUtc: toIso(rec.timestamp_utc),
      latitude: rec.latitude != null ? Number(rec.latitude) : null,
      longitude: rec.longitude != null ? Number(rec.longitude) : null,
      previousHash: rec.previous_hash,
    })
    if (recalculated !== rec.record_hash) {
      issues.push({ recordId: rec.id, employeeId: rec.employee_id, reason: 'hash_mismatch' })
    }
    expectedPreviousHash = rec.record_hash
  }

  return issues
}
