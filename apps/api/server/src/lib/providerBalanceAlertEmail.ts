import { Resend } from 'resend'

// Aviso INTERNO exclusivamente para el equipo de ConsentsPro — nunca se
// envía a ninguna clínica (B.3 del documento de ampliación: un saldo de
// proveedor agotado corta el servicio a TODAS las clínicas a la vez, es un
// problema de la plataforma, no de una clínica concreta).
export async function notifyTeamLowProviderBalance(provider: string, amount: number, currency: string, thresholdUsd: number) {
  const to = process.env.CONSENTSPRO_TEAM_EMAIL
  if (!to) {
    console.error(`[providerBalanceAlert] CONSENTSPRO_TEAM_EMAIL no configurado — no se pudo avisar de saldo bajo en ${provider} (${amount} ${currency})`)
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to,
    subject: `⚠️ ConsentsPro: saldo bajo en ${provider} (${amount} ${currency})`,
    html: `<!DOCTYPE html>
<html lang="es"><body style="font-family:sans-serif;padding:24px;color:#0f172a">
  <h2 style="color:#b91c1c">Saldo bajo en la cuenta de ${provider}</h2>
  <p>El saldo de la cuenta de ConsentsPro en <strong>${provider}</strong> es de
     <strong>${amount} ${currency}</strong>, por debajo del umbral configurado
     (${thresholdUsd} USD).</p>
  <p>Si este saldo se agota, el servicio de IA se corta para <strong>todas las
     clínicas a la vez</strong>, aunque cada una tenga saldo de sobra en su
     propio bono. Recarga la cuenta directamente en el panel del proveedor.</p>
</body></html>`,
  })
  if (error) console.error(`[providerBalanceAlert] fallo enviando aviso de saldo bajo (${provider}):`, error)
}
