import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { hasPositiveBalance, chargeCredit } from '../lib/creditService'
import { generateAiReply, type ChatMessage } from '../lib/aiProviders'
import { resolveIncomingConversation, generateDirectLink, matchRegisteredPatientClinic, type InteractiveListPayload } from '../lib/whatsappRouting'

const router = Router()
export const webhookRouter = Router()

const YCLOUD_BASE = 'https://api.ycloud.com/v2'

// Valor de clinicId/targetClinicId que representa "no es ninguna clínica,
// es ConsentsPro escribiendo como administrador de la plataforma" — para
// gestión de suscripciones, altas de nuevos clientes y cobros, con
// clinics.id no sirve porque no hay clínica de por medio.
const ADMIN_SCOPE = '__admin__'

// ⚠️ PENDIENTE DE VERIFICAR ANTES DE PRODUCCIÓN: YCloud/Meta facturan por
// CONVERSACIÓN de 24h (no por mensaje individual), y la política exacta
// (qué categorías son facturables, tarifa por país) ha cambiado varias
// veces durante 2026 según el propio documento de requisitos. Este valor
// es una estimación de coste medio por conversación de servicio mientras
// no se conecte el webhook de estado de YCloud (que sí informa del coste
// real y la categoría de cada conversación) — contrastar con
// https://docs.ycloud.com y la política vigente de Meta antes de confiar
// en esto para cobros reales.
const YCLOUD_ESTIMATED_CONVERSATION_COST_CENTS = 6 // ~0,06 € por conversación de servicio, estimación provisional

// Envío efectivo a YCloud + persistencia — compartido entre el envío manual
// (POST /send) y la respuesta automática del agente de IA.
async function sendViaYCloud(
  apiKey: string, clinicId: string | null, conversationId: string, phone: string, body: string,
  sender: 'clinica' | 'ia' | 'admin' = 'clinica'
) {
  let ycloudId: string | null = null
  let status = 'sent'
  let failureReason: string | null = null
  // Si falta esta variable de entorno, JSON.stringify elimina la clave
  // "from" por completo (undefined no se serializa) y YCloud responde con
  // un genérico "one or more of the parameters is missing" — se comprueba
  // aparte para que el motivo real quede claro sin tener que adivinarlo.
  if (!process.env.YCLOUD_WA_NUMBER?.trim()) {
    console.error('[whatsapp] falta la variable de entorno YCLOUD_WA_NUMBER — no se puede enviar ningún mensaje saliente')
    const message = await queryOne(
      `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, sender)
       VALUES ($1,$2,'outbound',$3,'failed',$4) RETURNING *`,
      [conversationId, clinicId, body, sender]
    )
    return { message, status: 'failed', failureReason: 'Falta configurar YCLOUD_WA_NUMBER en las variables de entorno del backend' }
  }
  try {
    const resp = await fetch(`${YCLOUD_BASE}/whatsapp/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.YCLOUD_WA_NUMBER, to: phone, type: 'text', text: { body } }),
    })
    const json: any = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      status = 'failed'
      // Antes no se registraba el motivo — solo se sabía que había fallado,
      // nunca por qué (ventana de 24h cerrada, número no verificado,
      // YCLOUD_WA_NUMBER mal configurado, etc.).
      failureReason = json?.message ?? json?.error?.message ?? `HTTP ${resp.status}`
      console.error(`[whatsapp] YCloud rechazó el envío a ${phone} (HTTP ${resp.status}):`, JSON.stringify(json))
    } else {
      ycloudId = json?.id ?? null
    }
  } catch (err: any) {
    status = 'failed'
    failureReason = err.message
    console.error(`[whatsapp] fallo de red enviando a ${phone}:`, err.message)
  }
  const message = await queryOne(
    `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, ycloud_id, sender)
     VALUES ($1,$2,'outbound',$3,$4,$5,$6) RETURNING *`,
    [conversationId, clinicId, body, status, ycloudId, sender]
  )
  await query(
    `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1 WHERE id = $2`,
    [body.slice(0, 120), conversationId]
  )
  return { message, status, failureReason }
}

// Genera y envía la respuesta automática del agente de WhatsApp con IA, y
// cobra el coste real a través de chargeCredit(). Nunca lanza — un fallo
// aquí no debe tumbar la recepción del webhook (YCloud reintentaría el
// envío del mensaje entrante si respondiéramos con error).
//
// clinicNameForIntro: si no es null, se antepone la identificación
// obligatoria de clínica ("te escribimos de [clínica] a través de
// ConsentsPro") — solo se pasa en el primer mensaje saliente de una
// conversación nueva (A.1 del documento de requisitos).
async function runWhatsAppAiAgent(
  clinicId: string, conversationId: string, phone: string, apiKey: string, clinicNameForIntro: string | null
) {
  try {
    const config = await queryOne<{ prompt: string | null; knowledge_base: string | null; wa_ai_enabled: boolean }>(
      'SELECT prompt, knowledge_base, wa_ai_enabled FROM clinic_api_config WHERE clinic_id = $1', [clinicId]
    )
    if (!config?.wa_ai_enabled || !config.prompt) return

    // Verificación previa (punto 3): comprobación rápida antes de gastar
    // dinero real llamando al proveedor de IA — NO sustituye el cálculo
    // exacto de chargeCredit(), solo evita ejecutar lo que luego no se
    // podría cobrar.
    if (!(await hasPositiveBalance(clinicId))) {
      await sendViaYCloud(apiKey, clinicId, conversationId, phone,
        'En este momento el asistente automático no está disponible. En breve el equipo de la clínica te atenderá.', 'ia')
      return
    }

    const recentRows = await query<{ direction: string; body: string }>(
      `SELECT direction, body FROM whatsapp_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [conversationId]
    )
    const history: ChatMessage[] = recentRows.reverse().map(r => ({
      role: r.direction === 'inbound' ? 'user' : 'assistant', content: r.body,
    }))
    // El contexto de IA se aísla estrictamente por clínica: solo el prompt
    // y la base de conocimiento de ESTA clinicId, ya resuelta con certeza
    // por resolveIncomingConversation() antes de llegar aquí.
    const systemPrompt = config.knowledge_base
      ? `${config.prompt}\n\n--- Base de conocimientos ---\n${config.knowledge_base}`
      : config.prompt

    const reply = await generateAiReply(systemPrompt, history)
    if (!reply.text.trim()) return

    const finalText = clinicNameForIntro
      ? `Hola, te escribimos de ${clinicNameForIntro} a través de ConsentsPro. ${reply.text}`
      : reply.text

    const { message } = await sendViaYCloud(apiKey, clinicId, conversationId, phone, finalText, 'ia')
    const messageId = (message as any)?.id ?? null
    await chargeCredit(clinicId, reply.provider, reply.realCostCents, messageId)
    // Coste de YCloud/Meta por la propia conversación — ver la constante
    // YCLOUD_ESTIMATED_CONVERSATION_COST_CENTS más arriba sobre por qué es
    // una estimación y no un coste exacto reportado por YCloud todavía.
    await chargeCredit(clinicId, 'ycloud', YCLOUD_ESTIMATED_CONVERSATION_COST_CENTS, messageId)
  } catch (err: any) {
    // InsufficientCreditError incluida — si el saldo se agotó justo entre
    // la verificación previa y el cobro real, simplemente no se cobra ni
    // se reintenta; el próximo mensaje volverá a pasar por la verificación previa.
    console.error(`[whatsapp] fallo en el agente de IA para clínica ${clinicId}:`, err.message)
  }
}

// hasAccess distingue "sin clínica seleccionada todavía" (clinicId null,
// isAdminScope false → 403) de "modo administrador, sin clínica a propósito"
// (clinicId null, isAdminScope true → acceso válido, ámbito global).
async function getRequesterClinicId(req: any, targetClinicId?: string): Promise<{ clinicId: string | null; isSuperAdmin: boolean; isAdminScope: boolean; hasAccess: boolean }> {
  const { userId } = req.user
  const me = await queryOne<{ clinic_id: string; role: string }>(
    'SELECT clinic_id, role FROM app_users WHERE id = $1', [userId]
  )
  if (!me) return { clinicId: null, isSuperAdmin: false, isAdminScope: false, hasAccess: false }
  const isSuperAdmin = me.role === 'superadmin'
  if (isSuperAdmin && targetClinicId === ADMIN_SCOPE) {
    return { clinicId: null, isSuperAdmin, isAdminScope: true, hasAccess: true }
  }
  if (isSuperAdmin && targetClinicId) {
    return { clinicId: targetClinicId, isSuperAdmin, isAdminScope: false, hasAccess: true }
  }
  return { clinicId: me.clinic_id, isSuperAdmin, isAdminScope: false, hasAccess: !!me.clinic_id }
}

// Ya no existe una clave de YCloud por clínica configurable (ver migración
// 063) — se usa siempre la clave única de sistema. Se mantiene la consulta
// a clinic_api_config.ycloud_api_key solo como compatibilidad hacia atrás,
// por si alguna clínica conservase un valor antiguo de cuando sí existía
// ese campo; en la práctica, hoy siempre cae en la clave compartida.
async function getYCloudKey(clinicId: string): Promise<string | null> {
  const row = await queryOne<{ ycloud_api_key: string }>(
    'SELECT ycloud_api_key FROM clinic_api_config WHERE clinic_id = $1', [clinicId]
  )
  if (row?.ycloud_api_key) return row.ycloud_api_key
  return getSharedYCloudKey()
}

// Número único de YCloud compartido por todas las clínicas (Parte A).
async function getSharedYCloudKey(): Promise<string | null> {
  const row = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'shared_ycloud_api_key'")
  return row?.value?.trim() ? row.value : null
}

// Registra en whatsapp_messages cualquier mensaje saliente que se mande
// fuera de sendViaYCloud (aclaraciones automáticas, listas interactivas) —
// antes solo se enviaban de verdad por WhatsApp pero nunca quedaban
// guardados, así que no aparecían en el panel aunque el paciente sí los
// hubiera recibido en su móvil.
async function recordOutboundMessage(conversationId: string, body: string, status: 'sent' | 'failed') {
  await query(
    `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, sender)
     VALUES ($1,NULL,'outbound',$2,$3,'ia')`,
    [conversationId, body, status]
  )
  await query(
    `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1 WHERE id = $2`,
    [body.slice(0, 120), conversationId]
  )
}

async function sendRawViaYCloud(apiKey: string, phone: string, body: string, conversationId: string) {
  if (!process.env.YCLOUD_WA_NUMBER?.trim()) {
    console.error('[whatsapp] falta la variable de entorno YCLOUD_WA_NUMBER — no se puede enviar la pregunta de aclaración')
    await recordOutboundMessage(conversationId, body, 'failed')
    return
  }
  let ok = false
  try {
    const resp = await fetch(`${YCLOUD_BASE}/whatsapp/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.YCLOUD_WA_NUMBER, to: phone, type: 'text', text: { body } }),
    })
    ok = resp.ok
    if (!ok) console.error(`[whatsapp] YCloud rechazó la pregunta de aclaración a ${phone} (HTTP ${resp.status}):`, await resp.text().catch(() => resp.statusText))
  } catch (err: any) {
    console.error('[whatsapp] fallo enviando pregunta de aclaración de clínica:', err.message)
  }
  await recordOutboundMessage(conversationId, body, ok ? 'sent' : 'failed')
}

// Envía una lista interactiva (selector de provincia / clínica) siguiendo
// el formato estándar de mensajes interactivos de WhatsApp Cloud API, que
// YCloud replica — ⚠️ no verificado todavía contra tráfico real de YCloud
// (su documentación no ha podido consultarse desde este entorno); revisar
// el primer envío real en logs por si el formato exacto difiriera.
async function sendInteractiveListViaYCloud(apiKey: string, phone: string, payload: InteractiveListPayload, conversationId: string) {
  // El "cuerpo" que queda guardado en el panel es el texto de la lista más
  // las opciones, para poder leer luego qué se ofreció sin tener que
  // reconstruir la lista interactiva original.
  const savedBody = `${payload.bodyText}\n${payload.sections.flatMap(s => s.rows.map(r => `• ${r.title}`)).join('\n')}`
  if (!process.env.YCLOUD_WA_NUMBER?.trim()) {
    console.error('[whatsapp] falta la variable de entorno YCLOUD_WA_NUMBER — no se puede enviar la lista interactiva')
    await recordOutboundMessage(conversationId, savedBody, 'failed')
    return
  }
  let ok = false
  try {
    const resp = await fetch(`${YCLOUD_BASE}/whatsapp/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.YCLOUD_WA_NUMBER,
        to: phone,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: payload.bodyText },
          action: { button: payload.buttonText, sections: payload.sections },
        },
      }),
    })
    ok = resp.ok
    if (!ok) console.error('[whatsapp] YCloud rechazó la lista interactiva:', await resp.text().catch(() => resp.statusText))
  } catch (err: any) {
    console.error('[whatsapp] fallo enviando lista interactiva:', err.message)
  }
  await recordOutboundMessage(conversationId, savedBody, ok ? 'sent' : 'failed')
}

// Guarda en la bandeja de administrador (visible para superadmin en modo
// "ConsentsPro (administrador)") un mensaje entrante que todavía no se ha
// podido resolver a ninguna clínica — para que quede constancia mientras
// el paciente no conteste a la pregunta de aclaración (o si nunca llega a
// contestar). source='sin_resolver', distinto de 'admin_directo', para que
// no se confunda con una conversación real iniciada por el superadmin.
async function recordUnresolvedInAdminInbox(phone: string, text: string): Promise<string> {
  let convo = await queryOne<{ id: string; source: string | null }>(
    `SELECT id, source FROM whatsapp_conversations WHERE clinic_id IS NULL AND phone = $1 ORDER BY last_message_at DESC NULLS LAST LIMIT 1`,
    [phone]
  )
  // Si la última conversación de admin para este número ya es una
  // 'admin_directo' real, no se reutiliza — se abre una nueva 'sin_resolver'.
  if (!convo || convo.source === 'admin_directo') {
    convo = await queryOne<{ id: string; source: string | null }>(
      `INSERT INTO whatsapp_conversations (clinic_id, phone, source) VALUES (NULL,$1,'sin_resolver') RETURNING id, source`,
      [phone]
    )
  }
  await query(
    `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, sender)
     VALUES ($1,NULL,'inbound',$2,'received','paciente')`,
    [convo!.id, text]
  )
  await query(
    `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1, unread_count = unread_count + 1 WHERE id = $2`,
    [text.slice(0, 120), convo!.id]
  )
  return convo!.id
}

async function isFirstOutboundMessage(conversationId: string): Promise<boolean> {
  const row = await queryOne<{ count: string }>(
    `SELECT count(*)::text AS count FROM whatsapp_messages WHERE conversation_id = $1 AND direction = 'outbound'`,
    [conversationId]
  )
  return (row?.count ?? '0') === '0'
}

async function getClinicDisplayName(clinicId: string): Promise<string> {
  const row = await queryOne<{ name: string; trade_name: string | null }>(
    'SELECT name, trade_name FROM clinics WHERE id = $1', [clinicId]
  )
  return row?.trade_name ?? row?.name ?? 'la clínica'
}

// GET /api/whatsapp/clinics — clinics the requester can operate WhatsApp
// for, con el total de mensajes sin leer de cada una (para el selector del
// panel, que como superadmin necesita ver de un vistazo dónde hay algo
// pendiente sin tener que entrar clínica por clínica).
const CLINICS_WITH_UNREAD_SQL = `
  SELECT c.id, c.name, c.trade_name, c.phone,
    COALESCE((SELECT SUM(wc.unread_count) FROM whatsapp_conversations wc WHERE wc.clinic_id = c.id), 0) AS unread
  FROM clinics c
`
router.get('/clinics', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string; role: string }>('SELECT clinic_id, role FROM app_users WHERE id = $1', [userId])
    if (!me) return res.json([])
    if (me.role === 'superadmin') {
      const data = await query(`${CLINICS_WITH_UNREAD_SQL} ORDER BY c.name`)
      return res.json(data)
    }
    if (!me.clinic_id) return res.json([])
    const data = await query(`${CLINICS_WITH_UNREAD_SQL} WHERE c.id = $1`, [me.clinic_id])
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/whatsapp/unread-summary — badges del menú lateral. Para
// superadmin, separa lo pendiente en la bandeja de administrador
// (clinic_id NULL) de lo pendiente en el conjunto de clínicas (para no
// mezclar "algo que tengo que responder yo" con "algo que responde cada
// clínica"); para el resto de roles, adminUnread siempre es 0 (no tienen
// acceso a esa bandeja) y clinicsUnread es solo el de su propia clínica.
router.get('/unread-summary', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string | null; role: string }>('SELECT clinic_id, role FROM app_users WHERE id = $1', [userId])
    if (!me) return res.json({ adminUnread: 0, clinicsUnread: 0 })
    if (me.role === 'superadmin') {
      const row = await queryOne<{ admin_unread: string; clinics_unread: string }>(
        `SELECT
           COALESCE(SUM(unread_count) FILTER (WHERE clinic_id IS NULL), 0) AS admin_unread,
           COALESCE(SUM(unread_count) FILTER (WHERE clinic_id IS NOT NULL), 0) AS clinics_unread
         FROM whatsapp_conversations`
      )
      return res.json({
        adminUnread: parseInt(row?.admin_unread ?? '0'),
        clinicsUnread: parseInt(row?.clinics_unread ?? '0'),
      })
    }
    if (!me.clinic_id) return res.json({ adminUnread: 0, clinicsUnread: 0 })
    const row = await queryOne<{ count: string }>(
      `SELECT COALESCE(SUM(unread_count), 0) AS count FROM whatsapp_conversations WHERE clinic_id = $1`,
      [me.clinic_id]
    )
    return res.json({ adminUnread: 0, clinicsUnread: parseInt(row?.count ?? '0') })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/whatsapp/status?clinicId=xxx — whether YCloud is configured for this clinic
router.get('/status', async (req, res) => {
  try {
    const { clinicId, isAdminScope, hasAccess } = await getRequesterClinicId(req, req.query.clinicId as string)
    if (!hasAccess) return res.status(403).json({ error: 'Sin acceso' })
    const key = isAdminScope ? await getSharedYCloudKey() : await getYCloudKey(clinicId!)
    return res.json({ configured: !!key })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/whatsapp/direct-link?clinicId=xxx — enlace directo de esta
// clínica al número único compartido de YCloud (A.5), para que la clínica
// lo copie y lo publique donde quiera. Evita la ambigüedad de origen.
router.get('/direct-link', async (req, res) => {
  try {
    const { clinicId, isAdminScope, hasAccess } = await getRequesterClinicId(req, req.query.clinicId as string)
    if (!hasAccess) return res.status(403).json({ error: 'Sin acceso' })
    if (isAdminScope) return res.status(404).json({ error: 'No aplica en modo administrador' })
    const clinic = await queryOne<{ whatsapp_code: string | null }>('SELECT whatsapp_code FROM clinics WHERE id = $1', [clinicId])
    if (!clinic?.whatsapp_code) return res.status(404).json({ error: 'Esta clínica no tiene código de WhatsApp asignado' })
    return res.json({ link: generateDirectLink(clinic.whatsapp_code), code: clinic.whatsapp_code })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/whatsapp/conversations?clinicId=xxx
router.get('/conversations', async (req, res) => {
  try {
    const { clinicId, isAdminScope, hasAccess } = await getRequesterClinicId(req, req.query.clinicId as string)
    if (!hasAccess) return res.status(403).json({ error: 'Sin acceso' })
    const data = isAdminScope
      ? await query(`SELECT * FROM whatsapp_conversations WHERE clinic_id IS NULL ORDER BY last_message_at DESC`)
      : await query(`SELECT * FROM whatsapp_conversations WHERE clinic_id = $1 ORDER BY last_message_at DESC`, [clinicId])
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/whatsapp/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { clinicId, isSuperAdmin, isAdminScope, hasAccess } = await getRequesterClinicId(req, req.query.clinicId as string)
    if (!hasAccess) return res.status(403).json({ error: 'Sin acceso' })
    const convo = isAdminScope
      ? await queryOne('SELECT id FROM whatsapp_conversations WHERE id = $1 AND clinic_id IS NULL', [req.params.id])
      : await queryOne('SELECT id FROM whatsapp_conversations WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!convo) return res.status(404).json({ error: 'Conversación no encontrada' })
    const data = await query(
      `SELECT * FROM whatsapp_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    )
    // Un superadmin puede entrar a supervisar/consultar la conversación de
    // una clínica real (no la suya) — eso no debe marcar los mensajes como
    // leídos, o la propia clínica perdería el aviso de "no leído" sin
    // haberlos visto de verdad. En modo administrador sí son mensajes
    // propios del superadmin, así que ahí sí se marcan como leídos.
    if (isAdminScope || !isSuperAdmin) {
      await query('UPDATE whatsapp_conversations SET unread_count = 0 WHERE id = $1', [req.params.id])
    }
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/whatsapp/send — { clinicId, phone, body, contactName? }
router.post('/send', async (req, res) => {
  try {
    const { phone, body, contactName, targetClinicId } = req.body
    if (!phone || !body) return res.status(400).json({ error: 'phone y body requeridos' })

    const { clinicId, isAdminScope, hasAccess } = await getRequesterClinicId(req, targetClinicId)
    if (!hasAccess) return res.status(403).json({ error: 'Sin acceso' })

    const apiKey = isAdminScope ? await getSharedYCloudKey() : await getYCloudKey(clinicId!)
    if (!apiKey) return res.status(400).json({ error: 'YCloud no está configurado. Añade la API Key en Configuración → Claves.' })

    // Ensure conversation exists
    let convo = isAdminScope
      ? await queryOne<{ id: string }>('SELECT id FROM whatsapp_conversations WHERE clinic_id IS NULL AND phone = $1', [phone])
      : await queryOne<{ id: string }>('SELECT id FROM whatsapp_conversations WHERE clinic_id = $1 AND phone = $2', [clinicId, phone])
    if (!convo) {
      convo = await queryOne<{ id: string }>(
        `INSERT INTO whatsapp_conversations (clinic_id, phone, contact_name, source) VALUES ($1,$2,$3,$4) RETURNING id`,
        [isAdminScope ? null : clinicId, phone, contactName ?? null, isAdminScope ? 'admin_directo' : 'mensaje_saliente_clinica']
      )
    }

    const { message, status, failureReason } = await sendViaYCloud(apiKey, isAdminScope ? null : clinicId, convo!.id, phone, body, isAdminScope ? 'admin' : 'clinica')

    if (status === 'failed') {
      return res.status(502).json({
        error: failureReason ? `Fallo al enviar el mensaje por YCloud: ${failureReason}` : 'Fallo al enviar el mensaje por YCloud',
        message,
      })
    }
    return res.status(201).json(message)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/whatsapp-webhook/:clinicId — YCloud inbound webhook (public, no auth)
webhookRouter.post('/:clinicId', async (req, res) => {
  try {
    const clinicId = req.params.clinicId
    const payload = req.body
    const msg = payload?.whatsappInboundMessage ?? payload
    const phone = msg?.from
    const text = msg?.text?.body ?? msg?.body ?? ''
    if (!phone) return res.status(200).json({ ok: true })

    let convo = await queryOne<{ id: string }>(
      'SELECT id FROM whatsapp_conversations WHERE clinic_id = $1 AND phone = $2', [clinicId, phone]
    )
    if (!convo) {
      convo = await queryOne<{ id: string }>(
        `INSERT INTO whatsapp_conversations (clinic_id, phone) VALUES ($1,$2) RETURNING id`,
        [clinicId, phone]
      )
    }

    await query(
      `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, ycloud_id, sender)
       VALUES ($1,$2,'inbound',$3,'received',$4,'paciente')`,
      [convo!.id, clinicId, text, msg?.id ?? null]
    )
    await query(
      `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1, unread_count = unread_count + 1 WHERE id = $2`,
      [text.slice(0, 120), convo!.id]
    )

    // Responde primero a YCloud (evita que reintente el webhook por
    // timeout) y dispara el agente de IA después, sin bloquear la respuesta.
    res.status(200).json({ ok: true })
    const apiKey = await getYCloudKey(clinicId)
    if (apiKey) {
      const isFirst = await isFirstOutboundMessage(convo!.id)
      const clinicNameForIntro = isFirst ? await getClinicDisplayName(clinicId) : null
      runWhatsAppAiAgent(clinicId, convo!.id, phone, apiKey, clinicNameForIntro).catch(() => {})
    }
    return
  } catch (err: any) { return res.status(200).json({ ok: true }) }
})

// POST /api/whatsapp-webhook — número único de YCloud compartido por TODAS
// las clínicas (Parte A del documento de ampliación). A diferencia del
// webhook anterior (que ya trae el clinicId en la URL, para las clínicas
// con número dedicado), aquí el clinic_id es DESCONOCIDO al llegar el
// mensaje y debe resolverse con certeza — o preguntarse explícitamente si
// hay ambigüedad — antes de generar cualquier respuesta de IA.
// Ver resolveIncomingConversation() en lib/whatsappRouting.ts y su REGLA DE
// ORO: nunca se genera contenido de IA sin clinic_id resuelto con certeza.
webhookRouter.post('/', async (req, res) => {
  const payload = req.body
  const msg = payload?.whatsappInboundMessage ?? payload
  const phone = msg?.from
  // Respuesta a una lista interactiva (provincia/clínica) — llega como
  // interactive.list_reply.id, no como texto normal. Formato asumido de
  // WhatsApp Cloud API (ver nota en sendInteractiveListViaYCloud).
  const interactiveReplyId: string | null = msg?.interactive?.list_reply?.id ?? null
  // Si es una respuesta de lista, se guarda el título elegido como "texto"
  // del mensaje (lo que ve el personal en la conversación), no el id interno.
  const text = msg?.text?.body ?? msg?.interactive?.list_reply?.title ?? msg?.body ?? ''

  // Se responde ya a YCloud (evita reintentos por timeout); el resto se
  // procesa después, sin bloquear la respuesta al webhook.
  res.status(200).json({ ok: true })
  if (!phone) return

  try {
    // La clave solo hace falta para RESPONDER (aclaración, lista
    // interactiva, agente de IA) — antes esto cortaba también el guardado
    // del mensaje entrante si faltaba la clave, así que un mensaje real
    // podía "no llegar" al panel aunque YCloud sí lo hubiera entregado.
    // Ahora el mensaje se guarda siempre que se pueda resolver la clínica;
    // solo se deja de responder automáticamente si falta la clave.
    const sharedKey = await getSharedYCloudKey()
    if (!sharedKey) {
      console.error('[whatsapp shared webhook] falta shared_ycloud_api_key en system_settings — se guardará el mensaje pero no se podrá responder automáticamente')
    }

    // Si la conversación más reciente de este número es una conversación de
    // administrador iniciada de verdad por el superadmin (source
    // 'admin_directo' — no cualquier fila con clinic_id NULL, para no
    // confundirla con un mensaje todavía sin resolver a clínica, ver más
    // abajo), la respuesta entrante es para esa bandeja de admin — PERO
    // solo si este número no tiene ninguna relación previa con una clínica
    // real, ni en conversaciones de WhatsApp NI como paciente ya dado de
    // alta (aunque nunca haya escrito por WhatsApp todavía). Si existe
    // cualquiera de las dos, esa relación manda siempre, aunque el mensaje
    // de administrador sea más reciente — de lo contrario, escribirle a un
    // paciente desde el modo administrador "secuestraría" para siempre sus
    // respuestas, apartándolas de la clínica a la que realmente pertenece.
    const mostRecent = await queryOne<{ id: string; clinic_id: string | null; source: string | null }>(
      `SELECT id, clinic_id, source FROM whatsapp_conversations WHERE phone = $1 ORDER BY last_message_at DESC NULLS LAST LIMIT 1`,
      [phone]
    )
    const hasClinicHistory = await queryOne<{ id: string }>(
      `SELECT id FROM whatsapp_conversations WHERE phone = $1 AND clinic_id IS NOT NULL LIMIT 1`,
      [phone]
    )
    const isRegisteredPatient = await matchRegisteredPatientClinic(phone)
    if (mostRecent && mostRecent.clinic_id === null && mostRecent.source === 'admin_directo' && !hasClinicHistory && !isRegisteredPatient) {
      await query(
        `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, sender)
         VALUES ($1,NULL,'inbound',$2,'received','paciente')`,
        [mostRecent.id, text]
      )
      await query(
        `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1, unread_count = unread_count + 1 WHERE id = $2`,
        [text.slice(0, 120), mostRecent.id]
      )
      return
    }

    const route = await resolveIncomingConversation(phone, text, interactiveReplyId)

    if (route.clarificationInteractive || route.clarificationMessage) {
      // Todavía no se sabe a qué clínica pertenece — antes esto no dejaba
      // NINGÚN rastro (ni conversación ni mensaje) hasta que el paciente
      // contestara a qué clínica se refería, así que un mensaje real podía
      // "no aparecer nunca" en ningún panel si no llegaba a responder. Ahora
      // queda visible igualmente en la bandeja de administrador (source
      // 'sin_resolver', distinta de 'admin_directo' para no interferir con
      // el enrutamiento normal cuando el paciente sí conteste).
      const adminConversationId = await recordUnresolvedInAdminInbox(phone, text)
      if (route.clarificationInteractive && sharedKey) {
        await sendInteractiveListViaYCloud(sharedKey, phone, route.clarificationInteractive, adminConversationId)
      } else if (route.clarificationMessage && sharedKey) {
        await sendRawViaYCloud(sharedKey, phone, route.clarificationMessage, adminConversationId)
      }
      return
    }
    if (!route.clinicId || !route.conversationId) return

    await query(
      `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, sender)
       VALUES ($1,$2,'inbound',$3,'received','paciente')`,
      [route.conversationId, route.clinicId, text]
    )
    await query(
      `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1, unread_count = unread_count + 1 WHERE id = $2`,
      [text.slice(0, 120), route.conversationId]
    )

    if (!sharedKey) return

    // Identificación obligatoria de clínica (A.1) solo en el primer mensaje
    // saliente de esta conversación — en mensajes posteriores ya quedó claro.
    const isFirst = await isFirstOutboundMessage(route.conversationId)
    const clinicNameForIntro = isFirst ? await getClinicDisplayName(route.clinicId) : null

    await runWhatsAppAiAgent(route.clinicId, route.conversationId, phone, sharedKey, clinicNameForIntro)
  } catch (err: any) {
    console.error('[whatsapp shared webhook] fallo procesando evento:', err.message)
  }
})

export default router
