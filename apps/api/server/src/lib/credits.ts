import { queryOne } from './db'

type CreditField = 'consents_available' | 'clinical_records_available' | 'photo_sessions_available'

const LABELS: Record<CreditField, string> = {
  consents_available:         'consentimientos',
  clinical_records_available: 'historias clínicas',
  photo_sessions_available:   'sesiones de fotos',
}

export async function deductCredit(clinicId: string, field: CreditField): Promise<void> {
  // Ensure row exists (10 default)
  await queryOne(
    `INSERT INTO clinic_credits (clinic_id) VALUES ($1)
     ON CONFLICT (clinic_id) DO NOTHING`,
    [clinicId]
  )
  const row = await queryOne<any>(`SELECT ${field} FROM clinic_credits WHERE clinic_id = $1`, [clinicId])
  if (!row || row[field] <= 0) {
    throw Object.assign(new Error(`Sin créditos disponibles de ${LABELS[field]}. Recarga tu plan para continuar.`), { status: 402 })
  }
  await queryOne(
    `UPDATE clinic_credits SET ${field} = ${field} - 1, updated_at = NOW() WHERE clinic_id = $1`,
    [clinicId]
  )
}
