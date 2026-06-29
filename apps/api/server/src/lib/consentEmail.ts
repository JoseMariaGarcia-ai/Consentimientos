import { queryOne } from './db'
import { downloadFile } from './r2'

interface ConsentEmailData {
  consentId: string
  pdfBuffer: Buffer
  clinicId: string
}

export async function sendConsentEmail({ consentId, pdfBuffer, clinicId }: ConsentEmailData) {
  // Get consent + patient + clinic + template info
  const consent = await queryOne<any>(
    `SELECT cr.id, cr.status, cr.signed_at,
            p.full_name, p.first_name, p.email AS patient_email, p.user_id,
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
  const portalUrl = `${appUrl}/patient/portal`

  // Get patient media (advertising) for this clinic
  const adCreative = await queryOne<any>(
    `SELECT cm.*, cms.active_creative_id, cms.display_mode
     FROM clinic_media cm
     JOIN clinic_media_settings cms ON cms.clinic_id = cm.clinic_id AND cms.media_type = 'patient'
     WHERE cm.clinic_id = $1
       AND cm.type = 'patient'
       AND (cms.display_mode != 'manual' OR cm.id = cms.active_creative_id)
     ORDER BY cm.order_index
     LIMIT 1`,
    [clinicId]
  )

  // Build ad block: image attachment or URL link
  let adHtml = ''
  let adAttachment: { filename: string; content: Buffer; contentType: string } | null = null

  if (adCreative) {
    if (adCreative.content_type === 'video/url' && adCreative.source_url) {
      const srcUrl: string = adCreative.source_url
      const ytMatch = srcUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      const vimeoMatch = srcUrl.match(/vimeo\.com\/(\d+)/)

      if (ytMatch) {
        const videoId = ytMatch[1]
        const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        adHtml = `
          <tr><td style="padding:0 40px 24px">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;text-align:center">De tu clínica</p>
            <a href="${srcUrl}" style="display:block;position:relative;text-decoration:none">
              <img src="${thumb}" alt="Ver vídeo"
                   style="width:100%;border-radius:10px;display:block" />
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                          width:60px;height:60px;background:rgba(0,0,0,0.65);border-radius:50%;
                          display:flex;align-items:center;justify-content:center">
                <div style="width:0;height:0;border-style:solid;border-width:10px 0 10px 20px;
                            border-color:transparent transparent transparent #ffffff;margin-left:4px"></div>
              </div>
            </a>
          </td></tr>`
      } else if (vimeoMatch) {
        const videoId = vimeoMatch[1]
        adHtml = `
          <tr><td style="padding:0 40px 24px">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;text-align:center">De tu clínica</p>
            <a href="${srcUrl}"
               style="display:inline-block;padding:12px 32px;background:#0D1B2E;color:#C9A84C;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;width:100%;box-sizing:border-box;text-align:center">
              ▶ Ver vídeo
            </a>
          </td></tr>`
      } else {
        // Direct video URL — use <video> with autoplay for Apple Mail; fallback CTA for others
        adHtml = `
          <tr><td style="padding:0 40px 24px">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;text-align:center">De tu clínica</p>
            <!--[if !mso]><!-->
            <video autoplay muted loop playsinline
                   style="width:100%;border-radius:10px;display:block"
                   src="${srcUrl}">
            </video>
            <!--<![endif]-->
            <!--[if mso]>
            <a href="${srcUrl}"
               style="display:inline-block;padding:12px 32px;background:#0D1B2E;color:#C9A84C;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px">
              ▶ Ver vídeo
            </a>
            <![endif]-->
          </td></tr>`
      }
    } else if (adCreative.r2_key && adCreative.content_type?.startsWith('image/')) {
      try {
        const { buffer, contentType } = await downloadFile(adCreative.r2_key)
        adAttachment = { filename: 'publicidad.jpg', content: buffer, contentType }
        adHtml = `
          <tr><td style="padding:0 40px 24px">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;text-align:center">De tu clínica</p>
            <img src="cid:ad_image" alt="De tu clínica"
                 style="width:100%;border-radius:10px;display:block" />
          </td></tr>`
      } catch {}
    }
  }

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
              para tu tratamiento. Encontrarás el documento adjunto en este email en formato PDF.
            </p>

            <!-- Document info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:18px 22px">
                  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:0.5px">Documento adjunto</p>
                  <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#0D1B2E">${treatmentType}</p>
                  <p style="margin:0;font-size:12px;color:#64748b">
                    ${consent.signed_at
                      ? `Firmado el ${new Date(consent.signed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`
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

  const attachments: any[] = [
    {
      filename: `consentimiento_${treatmentType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      content: pdfBuffer.toString('base64'),
      contentType: 'application/pdf',
    },
  ]

  if (adAttachment) {
    attachments.push({
      filename: adAttachment.filename,
      content: adAttachment.content.toString('base64'),
      contentType: adAttachment.contentType,
      content_id: 'ad_image',
      disposition: 'inline',
    })
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: consent.patient_email,
    ...(consent.clinic_email ? { replyTo: consent.clinic_email } : {}),
    subject: `Tu consentimiento informado — ${clinicName}`,
    html,
    attachments,
  })
}
