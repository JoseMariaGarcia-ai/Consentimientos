import { queryOne } from './db'

interface AppointmentConfirmationData {
  appointmentId: string
  clinicId: string
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
function fmtMoney(n: number) {
  return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export async function sendAppointmentConfirmationEmail({ appointmentId, clinicId }: AppointmentConfirmationData): Promise<boolean> {
  const appt = await queryOne<any>(
    `SELECT a.start_time,
            p.full_name, p.first_name, p.email AS patient_email,
            t.name AS treatment_name, t.price AS treatment_price,
            c.name AS clinic_name, c.trade_name, c.address AS clinic_address, c.phone AS clinic_phone
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     LEFT JOIN treatments t ON t.id = a.treatment_id
     JOIN clinics c ON c.id = $2
     WHERE a.id = $1`,
    [appointmentId, clinicId]
  )

  if (!appt?.patient_email) return false

  const firstName = appt.first_name ?? appt.full_name?.split(' ')[0] ?? 'Paciente'
  const clinicName = appt.trade_name ?? appt.clinic_name ?? 'Tu clínica'
  const start = new Date(appt.start_time)

  const rows = [
    ['Fecha', fmtDate(start)],
    ['Hora', fmtTime(start)],
    ['Clínica', clinicName],
    appt.clinic_address ? ['Dirección', appt.clinic_address] : null,
    appt.clinic_phone ? ['Teléfono', appt.clinic_phone] : null,
    appt.treatment_name ? ['Tratamiento', appt.treatment_name] : null,
    appt.treatment_price != null ? ['Importe', fmtMoney(appt.treatment_price)] : null,
  ].filter(Boolean) as [string, string][]

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 0;font-size:13px;font-weight:700;color:#C2410C;width:110px;vertical-align:top">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#334155">${value}</td>
    </tr>`).join('')

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
              Confirmación de cita
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 8px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1B2E">Hola, ${firstName} 👋</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
              Tu cita en <strong>${clinicName}</strong> ha sido confirmada. Estos son los detalles:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:20px 24px">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${rowsHtml}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6">
              Si necesitas cambiar o cancelar tu cita, ponte en contacto con la clínica.
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
    to: appt.patient_email,
    subject: `Confirmación de tu cita — ${clinicName}`,
    html,
  })
  if (error) console.error(`[appointmentConfirmationEmail] send to ${appt.patient_email} failed:`, error)
  return true
}
