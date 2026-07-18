import { queryOne } from './db'

interface InvoiceEmailData {
  invoiceId: string
  clinicId: string
  pdfBuffer: Buffer
  overrideEmail?: string | null
}

export interface InvoiceEmailResult {
  email: string | null // null = no había ningún email disponible para resolver
  sent: boolean        // false con email no-null = el envío a Resend falló
}

// Envía la factura de la clínica (paciente o cliente no-paciente) al email
// del destinatario. El email de destino se resuelve, por prioridad:
// 1) overrideEmail (edición puntual para este envío, sin tocar el dato
//    guardado en el paciente o en el billing_client)
// 2) el email del paciente o del billing_client, según recipient_type
export async function sendInvoiceEmail({ invoiceId, clinicId, pdfBuffer, overrideEmail }: InvoiceEmailData): Promise<InvoiceEmailResult> {
  const invoice = await queryOne<any>(
    `SELECT i.id, i.invoice_number, i.recipient_name, i.total_amount,
            p.email AS patient_email,
            bc.email AS billing_client_email,
            c.name AS clinic_name, c.phone AS clinic_phone, c.email AS clinic_email
     FROM invoices i
     LEFT JOIN patients p ON p.id = i.patient_id
     LEFT JOIN billing_clients bc ON bc.id = i.billing_client_id
     JOIN clinics c ON c.id = $2
     WHERE i.id = $1 AND i.clinic_id = $2`,
    [invoiceId, clinicId]
  )
  if (!invoice) return { email: null, sent: false }

  const toEmail = (overrideEmail || invoice.patient_email || invoice.billing_client_email || '').trim()
  if (!toEmail) return { email: null, sent: false }

  const clinicName = invoice.clinic_name ?? 'Tu clínica'
  const totalStr = (Number(invoice.total_amount) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

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
              Factura — ${invoice.invoice_number}
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1B2E">Hola, ${invoice.recipient_name} 👋</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
              Adjunto encontrarás la factura <strong>${invoice.invoice_number}</strong> de <strong>${clinicName}</strong>
              por un importe de <strong>${totalStr}</strong>.
            </p>
          </td>
        </tr>

        <tr><td style="padding:0 40px"><div style="height:1px;background:#E2E8F0"></div></td></tr>

        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#334155">${clinicName}</p>
            ${invoice.clinic_phone ? `<p style="margin:0 0 4px;font-size:12px;color:#94a3b8">${invoice.clinic_phone}</p>` : ''}
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
    to: toEmail,
    ...(invoice.clinic_email ? { replyTo: invoice.clinic_email } : {}),
    subject: `Tu factura ${invoice.invoice_number} — ${clinicName}`,
    html,
    attachments: [
      {
        filename: `factura_${invoice.invoice_number}.pdf`,
        content: pdfBuffer.toString('base64'),
        contentType: 'application/pdf',
      },
    ],
  })
  if (error) {
    console.error(`[invoiceEmail] fallo enviando factura a ${toEmail}:`, error)
    return { email: toEmail, sent: false }
  }
  return { email: toEmail, sent: true }
}
