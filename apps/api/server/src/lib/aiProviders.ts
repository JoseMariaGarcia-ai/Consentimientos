import Anthropic from '@anthropic-ai/sdk'
import { queryOne, query } from './db'

export type AiProviderName = 'anthropic' | 'openrouter'

export interface AiReplyResult {
  text: string
  provider: AiProviderName
  model: string
  realCostCents: number // YA incluye, si aplica, la comisión de recarga de OpenRouter — ver nota más abajo
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Interruptor central de sistema (no por clínica) — qué proveedor procesa
// las respuestas del agente en cada momento. Lee de system_settings, con
// 'anthropic' como valor por defecto si la tabla aún no tiene la fila.
export async function getActiveProvider(): Promise<AiProviderName> {
  const row = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'active_ai_provider'")
  return row?.value === 'openrouter' ? 'openrouter' : 'anthropic'
}

export async function setActiveProvider(provider: AiProviderName) {
  await query(
    `INSERT INTO system_settings (key, value, updated_at) VALUES ('active_ai_provider', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [provider]
  )
}

// ⚠️ PENDIENTE DE VERIFICAR ANTES DE FACTURAR EN PRODUCCIÓN: precios en
// USD por millón de tokens. Anthropic actualiza sus tarifas de vez en
// cuando — contrastar con https://www.anthropic.com/pricing antes de
// confiar en esta tabla para cobros reales. Están aquí en una constante
// única y fácil de editar por ese motivo.
const ANTHROPIC_PRICING_USD_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-opus-4-8':            { input: 15,   output: 75 },
  'claude-sonnet-5':            { input: 3,    output: 15 },
  'claude-haiku-4-5-20251001':  { input: 0.80, output: 4 },
}
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-5'

// Tipo de cambio USD→EUR aproximado, mismo motivo de "verificar antes de
// producción" que la tabla de precios — lo ideal a futuro es leerlo de un
// servicio de cambio en vivo en lugar de una constante fija.
const USD_TO_EUR = 0.92

function usdToCents(usd: number): number {
  return Math.ceil(usd * USD_TO_EUR * 100)
}

function anthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

async function generateAnthropicReply(systemPrompt: string, history: ChatMessage[]): Promise<AiReplyResult> {
  const model = DEFAULT_ANTHROPIC_MODEL
  const msg = await anthropicClient().messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: history.map(m => ({ role: m.role, content: m.content })),
  })
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('\n')
  const pricing = ANTHROPIC_PRICING_USD_PER_MTOK[model] ?? ANTHROPIC_PRICING_USD_PER_MTOK[DEFAULT_ANTHROPIC_MODEL]
  const costUsd = (msg.usage.input_tokens / 1_000_000) * pricing.input + (msg.usage.output_tokens / 1_000_000) * pricing.output
  return { text, provider: 'anthropic', model, realCostCents: usdToCents(costUsd) }
}

// OpenRouter — según su documentación oficial, no aplica margen propio
// sobre el precio por token de la mayoría de modelos (incluido Claude a
// fecha de redacción de este módulo), así que el coste real se toma
// directamente de la respuesta (usage.cost, en USD) pidiéndolo con
// `usage: { include: true }`, en vez de mantener una tabla de precios
// propia que podría desincronizarse. SÍ aplica comisión del 5,5% al
// recargar crédito de OpenRouter con tarjeta (5% con cripto, mínimo
// 0,80$) — ver addOpenRouterTopUpFeeCents más abajo, que se aplica sobre
// el importe recargado, no sobre cada llamada individual.
// ⚠️ PENDIENTE DE VERIFICAR ANTES DE PRODUCCIÓN: esta política de
// comisiones ha cambiado durante 2026 según el propio documento de
// requisitos — contrastar con https://openrouter.ai/docs antes de confiar
// en este cálculo para cobros reales.
async function generateOpenRouterReply(systemPrompt: string, history: ChatMessage[]): Promise<AiReplyResult> {
  const model = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-5'
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
      usage: { include: true },
    }),
  })
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error(`OpenRouter respondió ${resp.status}: ${errText}`)
  }
  const json: any = await resp.json()
  const text = json?.choices?.[0]?.message?.content ?? ''
  const costUsd = Number(json?.usage?.cost ?? 0)
  return { text, provider: 'openrouter', model, realCostCents: usdToCents(costUsd) }
}

export async function generateAiReply(systemPrompt: string, history: ChatMessage[]): Promise<AiReplyResult> {
  const provider = await getActiveProvider()
  return provider === 'openrouter'
    ? generateOpenRouterReply(systemPrompt, history)
    : generateAnthropicReply(systemPrompt, history)
}

// Comisión de recarga de crédito de OpenRouter (5,5% con tarjeta, mínimo
// 0,80$) — se aplica una única vez sobre el importe de la recarga, no por
// llamada. Solo relevante si algún día se recarga saldo de OpenRouter
// desde este sistema; hoy el saldo que gestiona ConsentsPro es el propio
// (clinic_credit_accounts), no crédito de OpenRouter directamente.
export function openRouterTopUpFeeCents(amountCents: number): number {
  return Math.max(Math.ceil(amountCents * 0.055), usdToCents(0.80))
}
