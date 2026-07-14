import { Resend } from 'resend'

interface StripeInvoiceEmailData {
  toEmail: string
  clinicName: string
  invoiceNumber: string
  totalCents: number
  pdfBuffer: Buffer
}

// Envía la factura propia de ConsentsPro (PDF con la identidad visual de
// ConsentsPro) por email — sustituye al PDF nativo de Stripe. No desactiva
// el email nativo de Stripe (ver nota en routes/billing.ts sobre por qué);
// el cliente puede recibir ambos hasta que se decida desactivar el de
// Stripe a nivel de cuenta.
export async function sendStripeInvoiceEmail({ toEmail, clinicName, invoiceNumber, totalCents, pdfBuffer }: StripeInvoiceEmailData): Promise<void> {
  const totalStr = (totalCents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: toEmail,
    subject: `Factura ${invoiceNumber} — ConsentsPro`,
    html: `<!DOCTYPE html>
<html lang="es"><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr><td style="background:#1a2744;padding:32px 40px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Consents<span style="color:#f59e0b;text-decoration:underline;text-underline-offset:3px">Pro</span></div>
        </td></tr>
        <tr><td style="padding:40px 40px 32px">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a">Factura ${invoiceNumber}</p>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6">
            Hola ${clinicName}, adjuntamos la factura de tu suscripción a ConsentsPro por un importe de
            <strong>${totalStr}</strong>. También puedes descargarla desde tu panel, en Facturación.
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;text-align:center">
          <p style="margin:0;font-size:11px;color:#cbd5e1">ConsentsPro · soporte@consentspro.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    attachments: [
      {
        filename: `factura_${invoiceNumber}.pdf`,
        content: pdfBuffer.toString('base64'),
        contentType: 'application/pdf',
      },
    ],
  })
  if (error) console.error(`[stripeInvoiceEmail] fallo enviando factura a ${toEmail}:`, error)
}
