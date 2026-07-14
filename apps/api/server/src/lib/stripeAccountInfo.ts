import { query, queryOne } from './db'

export interface IssuerInfo {
  name: string
  address: string | null
  taxId: string | null
}

// Datos fiscales de ConsentsPro como emisor de sus propias facturas de
// suscripción — configurados a mano en Configuración → Claves (superadmin)
// en vez de leerse en vivo de la API de Stripe. Se descartó leerlos de
// GET /v1/account porque el NIF/CIF real no es legible por API (Stripe solo
// expone si está puesto, no el valor, por cumplimiento) y porque el nombre
// legal/dirección configurados ahí pueden no coincidir con lo que se quiere
// mostrar en la factura — así el superadmin tiene control total y
// predecible sobre lo que aparece.
const KEYS = {
  name: 'consentspro_issuer_legal_name',
  address: 'consentspro_issuer_address',
  taxId: 'consentspro_issuer_tax_id',
} as const

export async function getIssuerInfo(): Promise<IssuerInfo> {
  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM system_settings WHERE key = ANY($1::text[])`,
    [Object.values(KEYS)]
  )
  const byKey = Object.fromEntries(rows.map(r => [r.key, r.value?.trim() || null]))
  return {
    name: byKey[KEYS.name] || 'ConsentsPro',
    address: byKey[KEYS.address] ?? null,
    taxId: byKey[KEYS.taxId] ?? null,
  }
}

export async function setIssuerField(field: keyof typeof KEYS, value: string): Promise<void> {
  await query(
    `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
    [KEYS[field], value.trim()]
  )
}

export async function getIssuerRaw(): Promise<{ legalName: string; address: string; taxId: string }> {
  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM system_settings WHERE key = ANY($1::text[])`,
    [Object.values(KEYS)]
  )
  const byKey = Object.fromEntries(rows.map(r => [r.key, r.value ?? '']))
  return {
    legalName: byKey[KEYS.name] ?? '',
    address: byKey[KEYS.address] ?? '',
    taxId: byKey[KEYS.taxId] ?? '',
  }
}
