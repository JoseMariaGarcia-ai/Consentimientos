import { queryOne } from './db'

// Parte B del documento de ampliación: vigilancia de SOLO LECTURA del saldo
// que ConsentsPro mantiene en sus propias cuentas con cada proveedor
// (Anthropic, Retell, YCloud) — una capa distinta del bono prepago de cada
// clínica (ya resuelto en creditService.ts). Regla explícita del documento:
// "No construir un sistema propio de gestión de este saldo: usar la
// auto-recarga nativa que cada proveedor ya ofrece en su panel." Este
// fichero SOLO consulta y muestra — nunca recarga nada.
//
// Verificado en el momento de implementar (julio 2026) qué proveedores
// exponen realmente una API de saldo:
//   - Anthropic: NO existe endpoint público de saldo (confirmado — issue
//     abierto anthropics/claude-code#47574 pidiendo justo esto). Solo se
//     puede consultar el panel de facturación manualmente.
//   - Retell: NO se ha encontrado un endpoint de saldo en su documentación
//     pública. Además, su modelo de facturación es post-pago (se cobra al
//     final del periodo contra la tarjeta registrada), no un saldo prepago
//     — por lo que "saldo agotado" puede no aplicar aquí en absoluto según
//     el plan contratado. Verificar el plan concreto de ConsentsPro en
//     https://docs.retellai.com/accounts/billing antes de asumir lo
//     contrario.
//   - YCloud: SÍ expone GET /v2/balance → { amount: number, currency: string }
//     (confirmado en su OpenAPI público, tag "Balance"). Es el único de los
//     tres con comprobación automática real.
// Si en el futuro Anthropic o Retell publican un endpoint de saldo, añadir
// aquí su consulta real sin tocar la forma de ProviderBalanceInfo.

export interface ProviderBalanceInfo {
  provider: 'anthropic' | 'retell' | 'ycloud'
  hasApi: boolean
  amount: number | null
  currency: string | null
  dashboardUrl: string
  note: string
  checkedAt: string
  error: string | null
}

const YCLOUD_BALANCE_URL = 'https://api.ycloud.com/v2/balance'

const DASHBOARD_URLS = {
  anthropic: 'https://console.anthropic.com/settings/billing',
  retell: 'https://dashboard.retellai.com/billing',
  ycloud: 'https://www.ycloud.com/console/balance',
} as const

// Caché en memoria de 15-30 min (punto B.2.3 del documento) — evita golpear
// las APIs de los proveedores en cada carga del panel de superadmin.
const CACHE_TTL_MS = 20 * 60 * 1000
let cache: { data: ProviderBalanceInfo[]; expiresAt: number } | null = null

async function getSharedYCloudKey(): Promise<string | null> {
  const row = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'shared_ycloud_api_key'")
  return row?.value?.trim() ? row.value : null
}

async function checkYCloudBalance(): Promise<ProviderBalanceInfo> {
  const now = new Date().toISOString()
  const apiKey = await getSharedYCloudKey()
  if (!apiKey) {
    return {
      provider: 'ycloud', hasApi: true, amount: null, currency: null,
      dashboardUrl: DASHBOARD_URLS.ycloud,
      note: 'Falta configurar la API Key del número compartido de YCloud (system_settings.shared_ycloud_api_key).',
      checkedAt: now, error: 'sin_api_key',
    }
  }
  try {
    const resp = await fetch(YCLOUD_BALANCE_URL, { headers: { 'X-API-Key': apiKey } })
    if (!resp.ok) {
      return {
        provider: 'ycloud', hasApi: true, amount: null, currency: null,
        dashboardUrl: DASHBOARD_URLS.ycloud, note: 'La consulta a YCloud falló.',
        checkedAt: now, error: `YCloud respondió ${resp.status}`,
      }
    }
    const json: any = await resp.json()
    return {
      provider: 'ycloud', hasApi: true, amount: Number(json.amount), currency: json.currency ?? null,
      dashboardUrl: DASHBOARD_URLS.ycloud, note: '', checkedAt: now, error: null,
    }
  } catch (err: any) {
    return {
      provider: 'ycloud', hasApi: true, amount: null, currency: null,
      dashboardUrl: DASHBOARD_URLS.ycloud, note: 'La consulta a YCloud falló.',
      checkedAt: now, error: err.message,
    }
  }
}

function noApiFallback(provider: 'anthropic' | 'retell', note: string): ProviderBalanceInfo {
  return {
    provider, hasApi: false, amount: null, currency: null,
    dashboardUrl: DASHBOARD_URLS[provider], note, checkedAt: new Date().toISOString(), error: null,
  }
}

export async function getProviderBalances(forceRefresh = false): Promise<ProviderBalanceInfo[]> {
  if (!forceRefresh && cache && cache.expiresAt > Date.now()) return cache.data

  const ycloud = await checkYCloudBalance()
  const anthropic = noApiFallback('anthropic',
    'Anthropic no publica un endpoint de saldo (verificado julio 2026). Consulta el saldo directamente en su panel de facturación.')
  const retell = noApiFallback('retell',
    'Retell no publica un endpoint de saldo público y su facturación puede ser post-pago según el plan. Consulta el panel de Retell directamente.')

  const data = [anthropic, retell, ycloud]
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS }
  return data
}
