import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { chargeCredit } from '../lib/creditService'
import { upsertRetellLlm, upsertRetellAgent, verifyRetellSignature, extractRetellCallCostCents } from '../lib/retellClient'

const router = Router()
export const webhookRouter = Router()

// La configuración del agente (prompt/base de conocimientos/claves) es
// superadmin-only, igual que el resto de clinic_api_config (ver
// routes/clinicConfig.ts) — un superadmin gestiona esto en nombre de la
// clínica seleccionada en el panel, así que se acepta un clinicId explícito
// además del propio de la clínica que llama.
async function resolveClinicId(userId: string, targetClinicId?: string): Promise<string | null> {
  const me = await queryOne<{ clinic_id: string; role: string }>('SELECT clinic_id, role FROM app_users WHERE id = $1', [userId])
  if (!me) return null
  if (me.role === 'superadmin' && targetClinicId) return targetClinicId
  return me.clinic_id ?? null
}

// POST /api/retell/sync — empuja el prompt/base de conocimientos de Retell
// (distintos de los de WhatsApp) al agente de voz de la clínica en Retell.
// El número de teléfono se compra/asigna manualmente en el dashboard de
// Retell la primera vez — este endpoint solo mantiene el motor de
// respuesta sincronizado con lo guardado en ConsentsPro.
router.post('/sync', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await resolveClinicId(userId, req.body?.targetClinicId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })

    const config = await queryOne<{
      retell_prompt: string | null; knowledge_base: string | null
      retell_llm_id: string | null; retell_agent_id: string | null
    }>(
      'SELECT retell_prompt, knowledge_base, retell_llm_id, retell_agent_id FROM clinic_api_config WHERE clinic_id = $1',
      [clinicId]
    )
    const retellKeyRow = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'system_retell_api_key'")
    const retellApiKey = retellKeyRow?.value?.trim()
    if (!retellApiKey) return res.status(400).json({ error: 'Falta configurar la API Key de Retell (Configuración → Claves)' })
    if (!config?.retell_prompt?.trim()) return res.status(400).json({ error: 'Escribe primero el prompt del agente de voz' })

    const clinic = await queryOne<{ name: string; trade_name: string | null }>('SELECT name, trade_name FROM clinics WHERE id = $1', [clinicId])

    const llmId = await upsertRetellLlm(retellApiKey, config.retell_llm_id, config.retell_prompt, config.knowledge_base)
    const agentId = await upsertRetellAgent(retellApiKey, config.retell_agent_id, llmId, clinic?.trade_name ?? clinic?.name ?? clinicId)

    await query(
      'UPDATE clinic_api_config SET retell_llm_id = $1, retell_agent_id = $2, updated_at = NOW() WHERE clinic_id = $3',
      [llmId, agentId, clinicId]
    )
    return res.json({ llmId, agentId })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/retell-webhook — eventos de Retell (público, verificado por
// firma HMAC en vez de sesión). Cobra el saldo cuando la llamada termina.
//
// ⚠️ Nota de alcance: la comprobación previa de saldo (punto 3 del
// documento de requisitos) está implementada de forma completa para el
// agente de WhatsApp, donde ConsentsPro genera la respuesta y puede negarse
// a hacerlo. Para Retell en modo "Retell LLM" (el usado aquí, sin
// infraestructura propia de telefonía) no existe un punto síncrono antes de
// que la llamada se conecte donde este backend pueda bloquearla — eso
// requeriría migrar a la integración "Custom LLM" de Retell (websocket
// propio), que queda fuera del alcance de esta implementación. Con saldo
// agotado, la llamada se conecta igualmente pero el cobro posterior fallará
// con InsufficientCreditError (se registra, no se reintenta) — el agente
// debe desactivarse manualmente (retell_ai_enabled) al agotar el saldo
// hasta recargar, o ampliar esto con la integración Custom LLM.
webhookRouter.post('/', async (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body)
    if (!verifyRetellSignature(rawBody, req.headers['x-retell-signature'] as string | undefined)) {
      return res.status(401).json({ error: 'Firma inválida' })
    }

    const event = req.body?.event
    const call = req.body?.call
    if (event !== 'call_ended' && event !== 'call_analyzed') return res.status(200).json({ ok: true })

    const agentId = call?.agent_id
    if (!agentId) return res.status(200).json({ ok: true })
    const config = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM clinic_api_config WHERE retell_agent_id = $1', [agentId])
    if (!config) return res.status(200).json({ ok: true })

    const callId = call?.call_id ?? null
    // Evita cobrar dos veces la misma llamada si Retell reintenta el
    // webhook o si tanto call_ended como call_analyzed llegan para la misma.
    if (callId) {
      const already = await queryOne('SELECT id FROM credit_transactions WHERE service = $1 AND service_reference_id = $2', ['retell', callId])
      if (already) return res.status(200).json({ ok: true })
    }

    const realCostCents = extractRetellCallCostCents(call)
    if (realCostCents > 0) {
      await chargeCredit(config.clinic_id, 'retell', realCostCents, callId)
    }
    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('[retell webhook] fallo procesando evento:', err.message)
    return res.status(200).json({ ok: true })
  }
})

export default router
