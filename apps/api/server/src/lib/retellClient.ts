import crypto from 'crypto'

// ⚠️ PENDIENTE DE VERIFICAR ANTES DE PRODUCCIÓN: estos son los endpoints y
// la forma de payload documentados por Retell AI (retellai.com/docs) en el
// momento de escribir este módulo. Retell, como cualquier API externa,
// puede cambiar su esquema — contrastar con su documentación vigente antes
// de depender de esto para llamadas reales de voz.
const RETELL_BASE = 'https://api.retellai.com'

interface RetellLlmResult { llm_id: string }
interface RetellAgentResult { agent_id: string }

async function retellFetch<T>(apiKey: string, path: string, method: string, body?: object): Promise<T> {
  const resp = await fetch(`${RETELL_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error(`Retell (${method} ${path}) respondió ${resp.status}: ${errText}`)
  }
  return resp.json() as Promise<T>
}

// Crea o actualiza el "Retell LLM" (motor de respuesta) de la clínica con
// su prompt general (retell_prompt) y base de conocimientos concatenada.
// Es un recurso independiente del prompt de WhatsApp (clinic_api_config.prompt).
export async function upsertRetellLlm(apiKey: string, existingLlmId: string | null, generalPrompt: string, knowledgeBase: string | null): Promise<string> {
  const fullPrompt = knowledgeBase ? `${generalPrompt}\n\n--- Base de conocimientos ---\n${knowledgeBase}` : generalPrompt
  const body = { general_prompt: fullPrompt }
  if (existingLlmId) {
    await retellFetch<RetellLlmResult>(apiKey, `/update-retell-llm/${existingLlmId}`, 'PATCH', body)
    return existingLlmId
  }
  const created = await retellFetch<RetellLlmResult>(apiKey, '/create-retell-llm', 'POST', body)
  return created.llm_id
}

// Crea o actualiza el "Agent" de voz que usa el LLM anterior. La voz y el
// número de teléfono asociado se configuran manualmente en el dashboard de
// Retell la primera vez (compra/asignación de número) — este método solo
// mantiene sincronizado el motor de respuesta con el prompt/base de
// conocimientos guardados en ConsentsPro.
export async function upsertRetellAgent(apiKey: string, existingAgentId: string | null, llmId: string, clinicName: string): Promise<string> {
  const body = {
    response_engine: { type: 'retell-llm', llm_id: llmId },
    agent_name: `ConsentsPro — ${clinicName}`,
  }
  if (existingAgentId) {
    await retellFetch<RetellAgentResult>(apiKey, `/update-agent/${existingAgentId}`, 'PATCH', body)
    return existingAgentId
  }
  const created = await retellFetch<RetellAgentResult>(apiKey, '/create-agent', 'POST', body)
  return created.agent_id
}

// Firma del webhook: Retell firma el cuerpo crudo con HMAC-SHA256 usando el
// secreto de la cuenta, en la cabecera x-retell-signature. Si no hay
// RETELL_WEBHOOK_SECRET configurado, se omite la verificación (con aviso en
// consola) en vez de rechazar todos los webhooks — permite desplegar el
// resto del módulo mientras se configura el secreto en Retell.
export function verifyRetellSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  const secret = process.env.RETELL_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[retellClient] RETELL_WEBHOOK_SECRET no configurado — webhook aceptado sin verificar firma')
    return true
  }
  if (!signatureHeader) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected))
  } catch {
    return false
  }
}

// ⚠️ PENDIENTE DE VERIFICAR: tarifa de Retell por minuto de llamada. Su
// pricing combina coste de la plataforma + coste de telefonía + coste del
// LLM subyacente; el webhook de fin de llamada normalmente incluye el
// coste real ya calculado (call.call_cost.combined_cost, en céntimos de
// dólar) — se usa ese valor directamente en vez de una tarifa fija propia,
// para no desincronizarse si Retell cambia sus precios.
export function extractRetellCallCostCents(callPayload: any): number {
  const combinedCostUsdCents = callPayload?.call_cost?.combined_cost
  if (typeof combinedCostUsdCents === 'number' && combinedCostUsdCents > 0) {
    // combined_cost de Retell ya viene en céntimos de dólar — se aproxima a
    // céntimos de euro con el mismo cambio usado en aiProviders.ts.
    return Math.ceil(combinedCostUsdCents * 0.92)
  }
  return 0
}
