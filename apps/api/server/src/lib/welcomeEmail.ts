import { queryOne } from './db'
import { PLAN_NAMES } from './plans'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

interface Category { icon: string; title: string; color: string; items: string[] }

const CAT_CONSENTS: Category = {
  icon: '📋', title: 'Consentimientos y documentación', color: '#6B21A8',
  items: [
    'Consentimientos informados ilimitados, con firma digital válida (eIDAS + Ley 41/2002)',
    'Envío de consentimientos por email al paciente',
    'Historia clínica completa por paciente',
    'Galería fotográfica y consentimiento de cesión de imágenes',
  ],
}
const CAT_AGENDA: Category = {
  icon: '📅', title: 'Agenda y pacientes', color: '#0D1B2E',
  items: [
    'Agenda de citas completa',
    'Recordatorios y confirmación de citas por email automáticos',
    'CRM de pacientes: historial, contacto y seguimiento centralizado',
    'Presupuestos para pacientes',
  ],
}
const CAT_TOXIN: Category = {
  icon: '💉', title: 'Tratamientos', color: '#7c2d12',
  items: ['Control de toxina botulínica: registro de lotes, unidades y zonas'],
}
const CAT_WHATSAPP: Category = {
  icon: '🤖', title: 'Agente de WhatsApp con IA', color: '#14532D',
  items: [
    'Agente de WhatsApp con IA 24/7',
    'Agenda citas automáticamente por WhatsApp',
    'Recordatorios y confirmación de citas por WhatsApp',
    'Información personalizada de tu clínica por WhatsApp',
    'Panel de gestión de conversaciones de WhatsApp',
    'Comunicación directa con pacientes por WhatsApp',
    'Envío de consentimientos, historia clínica, fotos y presupuestos por WhatsApp',
  ],
}
const CAT_VOICE: Category = {
  icon: '📞', title: 'Agente de voz IA', color: '#1C1408',
  items: [
    'Agente de voz IA 24/7 que contesta llamadas',
    'Agenda citas por teléfono automáticamente',
    'Información personalizada de tu clínica durante la llamada',
    'Clona la voz de tu recepcionista al 100 %',
  ],
}
const CAT_SOCIAL: Category = {
  icon: '📱', title: 'Gestión de redes sociales', color: '#831843',
  items: [
    'Gestión de Instagram y Facebook por un equipo dedicado',
    'Creatividades, edición y maquetación',
    'Configuración y optimización de campañas Meta Ads',
    'Captación y seguimiento de leads',
    'Estudio, asesoramiento, análisis y conversión',
    'Seguimiento diario de campañas y estadísticas',
    'Community manager dedicado y reunión semanal por videollamada',
  ],
}
const CAT_PATIENT_PORTAL: Category = {
  icon: '🧑‍⚕️', title: 'Portal del paciente', color: '#1e40af',
  items: [
    'Portal privado para cada paciente, sin contraseñas (acceso por Magic Link)',
    'Soporte técnico incluido',
  ],
}

const PLAN_CATEGORIES: Record<string, Category[]> = {
  base: [CAT_CONSENTS, CAT_PATIENT_PORTAL],
  pro: [CAT_CONSENTS, CAT_AGENDA, CAT_TOXIN, CAT_PATIENT_PORTAL],
  ia: [CAT_CONSENTS, CAT_AGENDA, CAT_TOXIN, CAT_WHATSAPP, CAT_PATIENT_PORTAL],
  'ia-plus': [CAT_CONSENTS, CAT_AGENDA, CAT_TOXIN, CAT_WHATSAPP, CAT_VOICE, CAT_PATIENT_PORTAL],
  redes: [CAT_CONSENTS, CAT_AGENDA, CAT_TOXIN, CAT_WHATSAPP, CAT_VOICE, CAT_SOCIAL, CAT_PATIENT_PORTAL],
}

function renderCategories(categories: Category[]): string {
  return categories.map(cat => `
            <p style="margin:0 0 10px;font-size:13px;font-weight:800;color:${cat.color};text-transform:uppercase;letter-spacing:0.4px">${cat.icon} ${cat.title}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
              ${cat.items.map(item => `<tr><td style="padding:4px 0;font-size:14px;color:#475569">✓ ${item}</td></tr>`).join('')}
            </table>`).join('')
}

export async function sendWelcomeEmail(clinicId: string, planId: string) {
  const clinic = await queryOne<{ name: string; email: string | null }>('SELECT name, email FROM clinics WHERE id = $1', [clinicId])
  if (!clinic?.email) return
  const planName = PLAN_NAMES[planId] ?? planId
  const categories = PLAN_CATEGORIES[planId] ?? PLAN_CATEGORIES.base

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <tr>
          <td style="background:#1a2744;padding:40px 40px;text-align:center">
            <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              Consents<span style="color:#f59e0b;text-decoration:underline;text-underline-offset:3px">Pro</span>
            </div>
            <div style="font-size:13px;color:#93afd4;margin-top:8px;letter-spacing:0.3px">
              Bienvenido a tu nueva cuenta
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px 8px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">¡Bienvenido a ConsentsPro! 🎉</p>
            <p style="margin:0 0 4px;font-size:15px;color:#64748b;line-height:1.6">
              Tu suscripción al <strong>${planName}</strong> ya está activa. En este documento tienes todo lo que necesitas para empezar a usar la plataforma y sacarle el máximo partido.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px 8px">
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px 22px">
              <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:0.4px">Antes de nada — Paso 1</p>
              <p style="margin:0;font-size:15px;color:#78350f;line-height:1.6">
                Completa los <strong>datos de tu clínica</strong> (nombre legal, NIF/CIF, dirección, logo, teléfono). Se hace desde <strong>Clínica → Datos fiscales</strong> nada más entrar, y es importante para que tus facturas y documentos salgan correctamente.
              </p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px 8px">
            <p style="margin:0 0 10px;font-size:13px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.4px">Cómo acceder</p>
            <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6">
              Te hemos enviado un email aparte con tu <strong>enlace de acceso seguro (Magic Link)</strong>. No necesitas contraseña: cada vez que quieras entrar, te llegará un enlace nuevo a tu correo.
            </p>
          </td>
        </tr>

        <tr><td style="padding:28px 40px 0"><div style="height:1px;background:#e2e8f0"></div></td></tr>

        <tr>
          <td style="padding:28px 40px 4px">
            <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0f172a">Todo lo que incluye tu ${planName}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8">Esto es lo que puedes hacer desde ya:</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 4px">
            ${renderCategories(categories)}
          </td>
        </tr>

        <tr>
          <td style="padding:16px 40px 8px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${APP_URL}/clinic"
                     style="display:inline-block;padding:14px 36px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px">
                    Completar datos de mi clínica
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:28px 40px 0"><div style="height:1px;background:#e2e8f0"></div></td></tr>
        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8">
              ¿Dudas? Escríbenos a soporte@consentspro.com — estaremos encantados de ayudarte.
            </p>
            <p style="margin:0;font-size:11px;color:#cbd5e1">
              ConsentsPro · Conforme a Ley 41/2002 · RGPD · eIDAS
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: clinic.email,
    subject: `Bienvenido a ConsentsPro — tu ${planName} ya está activo`,
    html,
  })
  if (error) console.error(`[welcomeEmail] send to ${clinic.email} failed:`, error)
}
