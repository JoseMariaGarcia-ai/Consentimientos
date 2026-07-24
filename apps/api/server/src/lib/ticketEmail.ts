import { queryOne } from './db'

interface TicketEmailData {
  ticketId: string
  clinicId: string
}

// Confirms receipt of a support ticket to whoever reported it. Returns false
// (without throwing) when the reporting user has no email on file.
export async function sendTicketConfirmationEmail({ ticketId, clinicId }: TicketEmailData): Promise<boolean> {
  const ticket = await queryOne<any>(
    `SELECT t.subject, t.description, t.created_at,
            u.email AS reporter_email, u.full_name AS reporter_name,
            c.name AS clinic_name, c.trade_name
     FROM support_tickets t
     LEFT JOIN app_users u ON u.id = t.created_by
     JOIN clinics c ON c.id = $2
     WHERE t.id = $1`,
    [ticketId, clinicId]
  )

  if (!ticket?.reporter_email) return false

  const firstName = ticket.reporter_name?.split(' ')[0] ?? 'Hola'
  const clinicName = ticket.trade_name ?? ticket.clinic_name ?? 'tu clínica'

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <tr><td style="background:#C9A84C;height:5px;font-size:0">&nbsp;</td></tr>

        <tr>
          <td style="background:#0D1B2E;padding:32px 40px;text-align:center">
            <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              Consents<span style="color:#C9A84C">Pro</span>
            </div>
            <div style="font-size:12px;color:#93afd4;margin-top:6px;letter-spacing:0.5px">
              Incidencia recibida
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 8px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1B2E">Hola, ${firstName} 👋</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
              Hemos recibido tu incidencia desde <strong>${clinicName}</strong>. Procedemos a
              revisar el error y darle solución lo antes posible.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:20px 24px">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#C2410C">${ticket.subject}</p>
                  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;white-space:pre-wrap">${ticket.description}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6">
              Te avisaremos en cuanto quede resuelta.
            </p>
          </td>
        </tr>

        <tr><td style="padding:0 40px"><div style="height:1px;background:#E2E8F0"></div></td></tr>

        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#334155">${clinicName}</p>
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">Powered by ConsentsPro</p>
          </td>
        </tr>

        <tr><td style="background:#C9A84C;height:5px;font-size:0">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: ticket.reporter_email,
    subject: `Hemos recibido tu incidencia — ${ticket.subject}`,
    html,
  })
  if (error) console.error(`[ticketEmail] send to ${ticket.reporter_email} failed:`, error)
  return true
}

interface TicketResolvedEmailData {
  ticketId: string
}

// Avisa a la clínica cuando el superadmin marca su incidencia como
// resuelta. Se envía a quien la reportó y, si no hay email de reportero
// (usuario borrado, etc.), al email general de la clínica.
export async function sendTicketResolvedEmail({ ticketId }: TicketResolvedEmailData): Promise<boolean> {
  const ticket = await queryOne<any>(
    `SELECT t.subject, t.description, t.notes,
            u.email AS reporter_email, u.full_name AS reporter_name,
            c.name AS clinic_name, c.trade_name, c.email AS clinic_email
     FROM support_tickets t
     LEFT JOIN app_users u ON u.id = t.created_by
     JOIN clinics c ON c.id = t.clinic_id
     WHERE t.id = $1`,
    [ticketId]
  )

  const recipient = ticket?.reporter_email || ticket?.clinic_email
  if (!ticket || !recipient) return false

  const firstName = ticket.reporter_name?.split(' ')[0] ?? 'Hola'
  const clinicName = ticket.trade_name ?? ticket.clinic_name ?? 'tu clínica'

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <tr><td style="background:#10B981;height:5px;font-size:0">&nbsp;</td></tr>

        <tr>
          <td style="background:#0D1B2E;padding:32px 40px;text-align:center">
            <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              Consents<span style="color:#C9A84C">Pro</span>
            </div>
            <div style="font-size:12px;color:#93afd4;margin-top:6px;letter-spacing:0.5px">
              Incidencia resuelta
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 8px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1B2E">Hola, ${firstName} 👋</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
              La incidencia reportada por <strong>${clinicName}</strong> ha sido <strong>resuelta</strong>.
              Puedes consultar el detalle desde el apartado de Incidencias.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:20px 24px">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#047857">${ticket.subject}</p>
                  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;white-space:pre-wrap">${ticket.description}</p>
                </td>
              </tr>
            </table>

            ${ticket.notes ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:20px 24px">
                  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:0.5px">Notas del equipo</p>
                  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;white-space:pre-wrap">${ticket.notes}</p>
                </td>
              </tr>
            </table>` : ''}

            <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6">
              Gracias por tu paciencia mientras la resolvíamos.
            </p>
          </td>
        </tr>

        <tr><td style="padding:0 40px"><div style="height:1px;background:#E2E8F0"></div></td></tr>

        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#334155">${clinicName}</p>
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">Powered by ConsentsPro</p>
          </td>
        </tr>

        <tr><td style="background:#10B981;height:5px;font-size:0">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: recipient,
    subject: `Tu incidencia ha sido resuelta — ${ticket.subject}`,
    html,
  })
  if (error) console.error(`[ticketEmail] resolved send to ${recipient} failed:`, error)
  return true
}
