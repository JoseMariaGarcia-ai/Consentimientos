import { queryOne } from './db'
import { notifyPatientDocumentAvailable } from './patientWhatsAppNotify'

interface BudgetEmailData {
  budgetId: string
  clinicId: string
  pdfBuffer: Buffer
}

// Returns false (without throwing) when the patient has no email on file —
// the caller surfaces that as a 400 rather than a generic 500.
export async function sendBudgetEmail({ budgetId, clinicId, pdfBuffer }: BudgetEmailData): Promise<boolean> {
  const budget = await queryOne<any>(
    `SELECT b.id, b.budget_number,
            p.id AS patient_id, p.full_name, p.first_name, p.email AS patient_email, p.phone AS patient_phone,
            c.name AS clinic_name, c.phone AS clinic_phone, c.email AS clinic_email
     FROM budgets b
     LEFT JOIN patients p ON p.id = b.patient_id
     JOIN clinics c ON c.id = $2
     WHERE b.id = $1`,
    [budgetId, clinicId]
  )

  if (!budget?.patient_email) return false

  const firstName = budget.first_name ?? budget.full_name?.split(' ')[0] ?? 'Paciente'
  const clinicName = budget.clinic_name ?? 'Tu clínica'

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
              Presupuesto — ${budget.budget_number}
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1B2E">Hola, ${firstName} 👋</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
              Adjunto encontrarás el presupuesto <strong>${budget.budget_number}</strong> elaborado por
              <strong>${clinicName}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;line-height:1.6">
              Si tienes cualquier duda sobre el presupuesto, no dudes en ponerte en contacto con nosotros.
            </p>
          </td>
        </tr>

        <tr><td style="padding:0 40px"><div style="height:1px;background:#E2E8F0"></div></td></tr>

        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#334155">${clinicName}</p>
            ${budget.clinic_phone ? `<p style="margin:0 0 4px;font-size:12px;color:#94a3b8">${budget.clinic_phone}</p>` : ''}
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
    to: budget.patient_email,
    ...(budget.clinic_email ? { replyTo: budget.clinic_email } : {}),
    subject: `Tu presupuesto — ${clinicName}`,
    html,
    attachments: [
      {
        filename: `presupuesto_${budget.budget_number}.pdf`,
        content: pdfBuffer.toString('base64'),
        contentType: 'application/pdf',
      },
    ],
  })
  if (error) console.error(`[budgetEmail] send to ${budget.patient_email} failed:`, error)

  // Plan IA o superior con la opción activada: el mismo aviso se manda
  // también por WhatsApp — best-effort, nunca bloquea el email ya enviado.
  if (budget.patient_id) {
    await notifyPatientDocumentAvailable(clinicId, budget.patient_id, budget.patient_phone, firstName, clinicName, 'presupuesto').catch(() => {})
  }

  return true
}
