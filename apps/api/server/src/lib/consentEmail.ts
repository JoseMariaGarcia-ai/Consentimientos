import { queryOne } from './db'
import { buildPatientAdBlock } from './patientAdBlock'
import { buildPatientPortalLink } from './patientMagicLink'
import { notifyPatientConsentGenerated } from './patientWhatsAppNotify'

interface ConsentEmailData {
  consentId: string
  pdfBuffer?: Buffer | null
  clinicId: string
}

export async function sendConsentEmail({ consentId, pdfBuffer, clinicId }: ConsentEmailData) {
  // Get consent + patient + clinic + template info
  const consent = await queryOne<any>(
    `SELECT cr.id, cr.status, cr.signed_at,
            p.id AS patient_id, p.full_name, p.first_name, p.email AS patient_email, p.phone AS patient_phone, p.user_id,
            t.treatment_type,
            c.name AS clinic_name, c.phone AS clinic_phone, c.email AS clinic_email
     FROM consent_records cr
     JOIN patients p ON p.id = cr.patient_id
     LEFT JOIN consent_templates t ON t.id = cr.template_id
     JOIN clinics c ON c.id = $2
     WHERE cr.id = $1`,
    [consentId, clinicId]
  )

  if (!consent?.patient_email) return // no email, nothing to send

  const firstName = consent.first_name ?? consent.full_name?.split(' ')[0] ?? 'Paciente'
  const treatmentType = consent.treatment_type ?? 'Consentimiento informado'
  const clinicName = consent.clinic_name ?? 'Tu clínica'
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  // Enlace de un solo uso que entra directamente al portal — sin esto, el
  // paciente aterrizaba en la pantalla de login (pensada para el personal
  // de la clínica) sin sesión iniciada y sin ver nada de su portal.
  const portalUrl = consent.user_id
    ? await buildPatientPortalLink(consent.user_id)
    : `${appUrl}/patient/portal`
  const portalHost = appUrl.replace(/^https?:\/\//, '')

  // Get patient media (advertising) for this clinic — resolved to whichever
  // clinic or lab partner actually owns it (see buildPatientAdBlock).
  const { adHtml, logImpression } = await buildPatientAdBlock(clinicId)

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Golden top bar -->
        <tr><td style="background:#C9A84C;height:5px;font-size:0">&nbsp;</td></tr>

        <!-- Header -->
        <tr>
          <td style="background:#0D1B2E;padding:28px 40px;text-align:center">
            <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              Consents<span style="color:#C9A84C">Pro</span>
            </div>
            <div style="font-size:11px;color:#93afd4;margin-top:5px;letter-spacing:0.5px">
              Consentimientos Informados Digitales
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px">
            <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0D1B2E">Hola, ${firstName} 👋</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
              La clínica <strong>${clinicName}</strong> ha generado un consentimiento informado
              para tu tratamiento. ${pdfBuffer ? 'Encontrarás el documento adjunto en este email en formato PDF.' : 'Puedes consultarlo y descargarlo en cualquier momento desde tu portal personal.'}
            </p>

            <!-- Document info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:18px 22px">
                  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:0.5px">${pdfBuffer ? 'Documento adjunto' : 'Consentimiento firmado'}</p>
                  <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#0D1B2E">${treatmentType}</p>
                  <p style="margin:0;font-size:12px;color:#64748b">
                    ${consent.signed_at
                      ? `Firmado el ${new Date(consent.signed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })}`
                      : 'Pendiente de firma'}
                  </p>
                </td>
              </tr>
            </table>

            <!-- Portal reminder box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:18px 22px">
                  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#C2410C;text-transform:uppercase;letter-spacing:0.5px">Tu portal personal</p>
                  <p style="margin:0 0 10px;font-size:14px;color:#334155;line-height:1.6">
                    Recuerda que puedes acceder en cualquier momento a todos tus consentimientos,
                    tu historia clínica y tus fotos de tratamiento desde tu portal personal.
                  </p>
                  <a href="${portalUrl}"
                     style="display:inline-block;padding:10px 24px;background:#C9A84C;color:#0D1B2E;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px">
                    Ir a mi portal →
                  </a>
                  <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;line-height:1.6">
                    O copia y pega este enlace en tu navegador:<br>
                    <span style="color:#2563eb;word-break:break-all">${portalUrl}</span>
                  </p>
                  <p style="margin:10px 0 0;font-size:11px;color:#94a3b8;line-height:1.6">
                    Este enlace es de un solo uso y caduca en 7 días. ¿Necesitas entrar más adelante?
                    Ve a <a href="${appUrl}/patient/portal" style="color:#2563eb">${portalHost}/patient/portal</a>
                    e introduce tu email — te enviaremos un nuevo enlace de acceso al momento.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${adHtml}

        <!-- Divider -->
        <tr><td style="padding:0 40px"><div style="height:1px;background:#E2E8F0"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;text-align:center">
            <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#334155">${clinicName}</p>
            ${consent.clinic_phone ? `<p style="margin:0 0 3px;font-size:12px;color:#94a3b8">${consent.clinic_phone}</p>` : ''}
            <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1">Powered by ConsentsPro · Ley 41/2002 · RGPD · eIDAS</p>
          </td>
        </tr>

        <!-- Golden bottom bar -->
        <tr><td style="background:#C9A84C;height:5px;font-size:0">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const attachments: any[] = pdfBuffer
    ? [{
        filename: `consentimiento_${treatmentType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: pdfBuffer.toString('base64'),
        contentType: 'application/pdf',
      }]
    : []

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: consent.patient_email,
    ...(consent.clinic_email ? { replyTo: consent.clinic_email } : {}),
    subject: `Tu consentimiento informado — ${clinicName}`,
    html,
    attachments,
  })
  if (error) console.error(`[consentEmail] send to ${consent.patient_email} failed:`, error)
  else await logImpression()

  // Plan IA o superior con la opción activada: el mismo aviso se manda
  // también por WhatsApp — best-effort, nunca bloquea el email ya enviado.
  await notifyPatientConsentGenerated(clinicId, consent.patient_id, consent.patient_phone, firstName, clinicName, treatmentType, portalUrl).catch(() => {})
}
