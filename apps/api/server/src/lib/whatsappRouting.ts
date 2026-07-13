import { query, queryOne } from './db'

export const CASE_A_QUESTION = '¡Hola! Para ayudarte mejor, ¿en qué clínica tienes tu cita o sobre cuál quieres información?'

export interface RoutedClinic { id: string; name: string; trade_name: string | null }

// Enlace directo por clínica — evita la ambigüedad desde el origen (A.5).
// El número usado es el número compartido de YCloud (una única cuenta para
// todas las clínicas), configurado en YCLOUD_WA_NUMBER.
export function generateDirectLink(whatsappCode: string): string {
  const number = (process.env.YCLOUD_WA_NUMBER ?? '').replace(/[^\d]/g, '')
  return `https://wa.me/${number}?text=${encodeURIComponent(`CLINICA_${whatsappCode}`)}`
}

const DIRECT_LINK_RE = /CLINICA_([A-Z0-9]{4,10})/i

export function detectDirectLinkCode(text: string): string | null {
  const m = text.match(DIRECT_LINK_RE)
  return m ? m[1].toUpperCase() : null
}

// Coincidencia por nombre en texto libre — heurística deliberadamente
// simple (substring, sin distinguir mayúsculas/tildes) para resolver el
// Caso A (número nuevo) y la reformulación del Caso C (>90 días). Si el
// texto menciona más de una clínica candidata, se considera que sigue
// siendo ambiguo — nunca se adivina.
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function matchClinicByName(text: string, candidates: RoutedClinic[]): RoutedClinic | null {
  const normalizedText = normalize(text)
  const matches = candidates.filter(c => {
    const name = normalize(c.trade_name ?? c.name)
    return name.length > 2 && normalizedText.includes(name)
  })
  return matches.length === 1 ? matches[0] : null
}

export interface RouteResult {
  clinicId: string | null
  conversationId: string | null
  source: 'link_directo' | 'pregunta_ambigua' | 'recencia_automatica' | null
  clarificationMessage: string | null // si no es null, se envía TAL CUAL, sin pasar por el agente de IA
}

// REGLA DE ORO: nunca se genera una respuesta de IA sin haber determinado
// con certeza (o preguntado si hay ambigüedad) a qué clinic_id pertenece
// la conversación. Esta función es el único punto que decide eso — el
// webhook compartido SIEMPRE debe pasar por aquí antes de cargar cualquier
// prompt/base de conocimiento.
export async function resolveIncomingConversation(phone: string, text: string): Promise<RouteResult> {
  // 1. Link directo — señal más fuerte e inequívoca posible.
  const code = detectDirectLinkCode(text)
  if (code) {
    const clinic = await queryOne<{ id: string }>('SELECT id FROM clinics WHERE whatsapp_code = $1', [code])
    if (clinic) {
      const conversationId = await ensureConversation(clinic.id, phone, 'link_directo')
      return { clinicId: clinic.id, conversationId, source: 'link_directo', clarificationMessage: null }
    }
  }

  // 2. Historial de conversaciones existentes para este número, en CUALQUIER clínica.
  const history = await query<{ clinic_id: string; last_message_at: string }>(
    'SELECT clinic_id, MAX(last_message_at) AS last_message_at FROM whatsapp_conversations WHERE phone = $1 GROUP BY clinic_id',
    [phone]
  )

  if (history.length === 0) {
    // Caso A: número totalmente nuevo. Se intenta resolver por si el texto
    // ya menciona el nombre de una clínica (respuesta a una pregunta
    // anterior, o el paciente ya lo escribió por iniciativa propia).
    const clinics = await query<RoutedClinic>('SELECT id, name, trade_name FROM clinics')
    const match = matchClinicByName(text, clinics)
    if (match) {
      const conversationId = await ensureConversation(match.id, phone, 'pregunta_ambigua')
      return { clinicId: match.id, conversationId, source: 'pregunta_ambigua', clarificationMessage: null }
    }
    return { clinicId: null, conversationId: null, source: null, clarificationMessage: CASE_A_QUESTION }
  }

  if (history.length === 1) {
    // Caso B: una única clínica en el historial — se enruta sin preguntar.
    const clinicId = history[0].clinic_id
    const conversationId = await ensureConversation(clinicId, phone, null)
    return { clinicId, conversationId, source: null, clarificationMessage: null }
  }

  // Caso C: ambigüedad — más de una clínica tiene conversación con este número.
  const windowDaysRow = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'wa_ambiguity_window_days'")
  const windowDays = Number(windowDaysRow?.value ?? 90)
  const sorted = [...history].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
  const mostRecent = sorted[0]
  const daysSince = (Date.now() - new Date(mostRecent.last_message_at).getTime()) / (24 * 3600 * 1000)

  if (daysSince <= windowDays) {
    // Por defecto: enrutar a la clínica más reciente.
    const conversationId = await ensureConversation(mostRecent.clinic_id, phone, 'recencia_automatica')
    return { clinicId: mostRecent.clinic_id, conversationId, source: 'recencia_automatica', clarificationMessage: null }
  }

  // Han pasado más de windowDays: reformular la pregunta salvo que el
  // propio texto entrante ya mencione cuál de las candidatas es.
  const candidateIds = history.map(h => h.clinic_id)
  const candidates = await query<RoutedClinic>(
    `SELECT id, name, trade_name FROM clinics WHERE id = ANY($1::uuid[])`, [candidateIds]
  )
  const match = matchClinicByName(text, candidates)
  if (match) {
    const conversationId = await ensureConversation(match.id, phone, 'pregunta_ambigua')
    return { clinicId: match.id, conversationId, source: 'pregunta_ambigua', clarificationMessage: null }
  }
  const names = candidates.map(c => c.trade_name ?? c.name)
  return {
    clinicId: null, conversationId: null, source: null,
    clarificationMessage: `¡Hola de nuevo! Para no confundir tu consulta, ¿nos escribes por ${names.join(' o por ')}?`,
  }
}

async function ensureConversation(clinicId: string, phone: string, source: RouteResult['source']): Promise<string> {
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM whatsapp_conversations WHERE clinic_id = $1 AND phone = $2', [clinicId, phone]
  )
  if (existing) return existing.id
  const created = await queryOne<{ id: string }>(
    `INSERT INTO whatsapp_conversations (clinic_id, phone, source, status) VALUES ($1,$2,$3,'activa') RETURNING id`,
    [clinicId, phone, source]
  )
  return created!.id
}
