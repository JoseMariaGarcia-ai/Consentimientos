import { query } from './db'
import { notifyClinicCertificateExpiring } from './certificateExpiryEmail'

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // diaria

interface CertRow {
  id: string
  clinic_id: string
  valid_until: string
  notified_30d_at: string | null
  notified_15d_at: string | null
  notified_expiry_at: string | null
  clinic_name: string
}

// pg devuelve las columnas DATE ya como objetos Date (medianoche UTC), no
// como strings — de ahí pasar por toISOString().slice(0,10) en vez de
// interpolar el valor directamente en un template literal de fecha.
function daysUntil(validUntil: string | Date): number {
  const dateOnly = new Date(validUntil).toISOString().slice(0, 10)
  const ms = new Date(`${dateOnly}T00:00:00Z`).getTime() - new Date(new Date().toDateString()).getTime()
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

async function clinicAdminEmails(clinicId: string): Promise<string[]> {
  const rows = await query<{ email: string }>(
    `SELECT email FROM app_users WHERE clinic_id = $1 AND role = 'clinica'`, [clinicId]
  )
  return rows.map(r => r.email)
}

async function runCheck() {
  try {
    const certs = await query<CertRow>(
      `SELECT c.id, c.clinic_id, c.valid_until, c.notified_30d_at, c.notified_15d_at, c.notified_expiry_at,
              cl.name AS clinic_name
       FROM clinic_digital_certificates c
       JOIN clinics cl ON cl.id = c.clinic_id
       WHERE c.status = 'activo' AND c.environment = 'production'`
    )
    for (const cert of certs) {
      const daysLeft = daysUntil(cert.valid_until)
      let column: 'notified_30d_at' | 'notified_15d_at' | 'notified_expiry_at' | null = null
      let urgency: 'aviso' | 'critico' = 'aviso'

      if (daysLeft <= 0 && !cert.notified_expiry_at) { column = 'notified_expiry_at'; urgency = 'critico' }
      else if (daysLeft <= 15 && !cert.notified_15d_at) { column = 'notified_15d_at'; urgency = 'aviso' }
      else if (daysLeft <= 30 && !cert.notified_30d_at) { column = 'notified_30d_at'; urgency = 'aviso' }

      if (!column) continue

      const emails = await clinicAdminEmails(cert.clinic_id)
      const sent = await notifyClinicCertificateExpiring(emails, cert.clinic_name, Math.max(daysLeft, 0), cert.valid_until, urgency)
      // Si el envío falla (o no hay ningún admin 'clinica' todavía), no se
      // marca como notificado — se reintenta en la siguiente pasada diaria
      // en vez de perder para siempre el aviso de ese umbral.
      if (sent) {
        await query(`UPDATE clinic_digital_certificates SET ${column} = NOW() WHERE id = $1`, [cert.id])
      }
    }
  } catch (err: any) {
    console.error('[certificateExpiryScheduler] fallo comprobando caducidad de certificados:', err.message)
  }
}

export function startCertificateExpiryScheduler() {
  runCheck()
  setInterval(runCheck, CHECK_INTERVAL_MS)
}
