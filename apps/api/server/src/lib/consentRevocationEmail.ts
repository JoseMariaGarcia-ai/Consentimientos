import { Resend } from 'resend'
import { queryOne } from './db'

function emailHtml(opts: {
  patientName: string
  treatmentType: string
  reason: string
  revokedAt: string
  patientUrl: string
}): string {
  const revokedDate = new Date(opts.revokedAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr><td style="background:#1a2744;padding:32px 40px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Consents<span style="color:#f59e0b;text-decoration:underline;text-underline-offset:3px">Pro</span></div>
          <div style="font-size:12px;color:#93afd4;margin-top:6px;letter-spacing:0.3px">Consentimiento revocado</div>
        </td></tr>
        <tr><td style="padding:40px 40px 32px">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.5px">Aviso</p>
          <p style="margin:0 0 24px;font-size:16px;color:#0f172a;line-height:1.6">
            Se ha revocado un consentimiento firmado de <strong>${opts.patientName}</strong> para el tratamiento
            <strong>${opts.treatmentType}</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:16px">
            <tr><td style="font-size:13px;color:#64748b;padding-bottom:6px">Fecha de revocación</td></tr>
            <tr><td style="font-size:15px;font-weight:700;color:#0f172a;padding-bottom:14px">${revokedDate}</td></tr>
            <tr><td style="font-size:13px;color:#64748b;padding-bottom:6px">Motivo</td></tr>
            <tr><td style="font-size:15px;color:#0f172a">${opts.reason}</td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${opts.patientUrl}" style="display:inline-block;padding:14px 36px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px">Ver ficha del paciente</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>
        <tr><td style="padding:24px 40px;text-align:center">
          <p style="margin:0;font-size:11px;color:#cbd5e1">El documento firmado original se conserva sin cambios como prueba.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// Se llama best-effort desde el endpoint de revocación — un fallo de envío
// de email nunca debe revertir ni afectar a la revocación ya guardada.
export async function notifyConsentRevoked(consentId: string, clinicId: string) {
  const data = await queryOne<{
    patient_name: string; patient_id: string; treatment_type: string | null
    revocation_reason: string; revoked_at: string; clinic_email: string | null
  }>(
    `SELECT p.full_name AS patient_name, p.id AS patient_id, t.treatment_type,
            cr.revocation_reason, cr.revoked_at, c.email AS clinic_email
     FROM consent_records cr
     JOIN patients p ON p.id = cr.patient_id
     LEFT JOIN consent_templates t ON t.id = cr.template_id
     JOIN clinics c ON c.id = $2
     WHERE cr.id = $1`,
    [consentId, clinicId]
  )
  if (!data?.clinic_email) return

  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: data.clinic_email,
    subject: `Consentimiento revocado — ${data.patient_name}`,
    html: emailHtml({
      patientName: data.patient_name,
      treatmentType: data.treatment_type ?? 'Consentimiento informado',
      reason: data.revocation_reason,
      revokedAt: data.revoked_at,
      patientUrl: `${appUrl}/patients/${data.patient_id}`,
    }),
  })
  if (error) console.error(`[consentRevocationEmail] fallo enviando email a ${data.clinic_email}:`, error)
}
