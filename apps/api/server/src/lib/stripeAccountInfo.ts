import { getStripe } from './stripe'
import { queryOne } from './db'

export interface IssuerInfo {
  name: string
  address: string | null
  taxId: string | null
}

// ⚠️ PENDIENTE DE VERIFICAR ANTES DE PRODUCCIÓN: la API de Stripe
// (GET /v1/account) SÍ devuelve business_profile.name/company.name y
// company.address de forma fiable, pero el NIF/CIF real NO se puede leer
// vía API — solo se expone company.tax_id_provided (booleano), el valor en
// sí queda oculto por motivos de cumplimiento/seguridad (comportamiento
// documentado de Stripe, no un bug de esta implementación). Por eso el
// NIF/CIF se configura una única vez a mano en system_settings
// (consentspro_issuer_tax_id) en vez de leerse en vivo. Verificar también
// que Settings → Business details tiene rellenos nombre y dirección antes
// de confiar en esto para facturas reales.
let cache: { info: IssuerInfo; expiresAt: number } | null = null
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora, según el documento de requisitos

export async function getIssuerInfo(): Promise<IssuerInfo> {
  if (cache && cache.expiresAt > Date.now()) return cache.info

  const account = await getStripe().accounts.retrieveCurrent()
  const name = account.company?.name || account.business_profile?.name || 'ConsentsPro'
  const addr = account.company?.address
  const address = addr
    ? [addr.line1, addr.line2, addr.postal_code, addr.city, addr.state].filter(Boolean).join(', ')
    : null

  const taxIdRow = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'consentspro_issuer_tax_id'")
  const taxId = taxIdRow?.value?.trim() || null

  const info: IssuerInfo = { name, address, taxId }
  cache = { info, expiresAt: Date.now() + CACHE_TTL_MS }
  return info
}
