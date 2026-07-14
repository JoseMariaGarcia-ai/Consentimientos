import { Router } from 'express'
import { PDFParse } from 'pdf-parse'
import { query, queryOne } from '../lib/db'

const router = Router()

// This entire module is superadmin-only: API keys, knowledge base and prompts
// must never be readable/writable by clinica/lab_partner/patient roles.
async function requireSuperAdminClinicId(req: any, targetClinicId?: string): Promise<string | null> {
  const { userId } = req.user
  const me = await queryOne<{ clinic_id: string; role: string }>(
    'SELECT clinic_id, role FROM app_users WHERE id = $1', [userId]
  )
  if (!me || me.role !== 'superadmin') return null
  return targetClinicId ?? me.clinic_id ?? null
}

async function isSuperAdmin(req: any): Promise<boolean> {
  const { userId } = req.user
  const me = await queryOne<{ role: string }>('SELECT role FROM app_users WHERE id = $1', [userId])
  return me?.role === 'superadmin'
}

// GET /api/clinic-config/clinics — list all clinics (superadmin only)
router.get('/clinics', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ role: string }>('SELECT role FROM app_users WHERE id = $1', [userId])
    if (me?.role !== 'superadmin') return res.status(403).json({ error: 'Solo superadmin' })
    const data = await query('SELECT id, name, trade_name FROM clinics ORDER BY name')
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/clinic-config?clinicId=xxx — superadmin only
router.get('/', async (req, res) => {
  try {
    const clinicId = await requireSuperAdminClinicId(req, req.query.clinicId as string)
    if (!clinicId) return res.status(403).json({ error: 'Solo superadmin' })
    const data = await queryOne('SELECT * FROM clinic_api_config WHERE clinic_id = $1', [clinicId])
    return res.json(data ?? { clinic_id: clinicId })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/clinic-config/extract-pdf — superadmin only. Extracts plain text
// from an uploaded PDF so it can prefill the prompt / knowledge base memo
// fields instead of the admin having to retype the document by hand.
router.post('/extract-pdf', async (req, res) => {
  try {
    if (!(await isSuperAdmin(req))) return res.status(403).json({ error: 'Solo superadmin' })

    const { fileBase64 } = req.body
    if (!fileBase64) return res.status(400).json({ error: 'fileBase64 requerido' })

    const buffer = Buffer.from(fileBase64, 'base64')
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      return res.json({ text: result.text.trim() })
    } finally {
      await parser.destroy()
    }
  } catch (err: any) { return res.status(500).json({ error: 'No se pudo leer el PDF: ' + err.message }) }
})

// PUT /api/clinic-config — superadmin only. YCloud/Anthropic/Retell ya no
// se configuran por clínica (ver migración 063) — solo quedan por clínica
// la base de conocimientos y los dos prompts (WhatsApp y Retell).
router.put('/', async (req, res) => {
  try {
    const { targetClinicId, knowledge_base, prompt, retell_prompt, wa_ai_enabled, retell_ai_enabled } = req.body
    const clinicId = await requireSuperAdminClinicId(req, targetClinicId)
    if (!clinicId) return res.status(403).json({ error: 'Solo superadmin' })
    const data = await queryOne(
      `INSERT INTO clinic_api_config (clinic_id, knowledge_base, prompt, retell_prompt, wa_ai_enabled, retell_ai_enabled, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (clinic_id) DO UPDATE SET
         knowledge_base=$2, prompt=$3, retell_prompt=$4, wa_ai_enabled=$5, retell_ai_enabled=$6, updated_at=NOW()
       RETURNING *`,
      [clinicId, knowledge_base ?? null, prompt ?? null, retell_prompt ?? null, !!wa_ai_enabled, !!retell_ai_enabled]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET/PUT /api/clinic-config/ai-provider — interruptor central de sistema
// (no por clínica): qué proveedor de IA procesa las llamadas del agente.
router.get('/ai-provider', async (req, res) => {
  try {
    if (!(await isSuperAdmin(req))) return res.status(403).json({ error: 'Solo superadmin' })
    const { getActiveProvider } = await import('../lib/aiProviders')
    return res.json({ provider: await getActiveProvider() })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/ai-provider', async (req, res) => {
  try {
    if (!(await isSuperAdmin(req))) return res.status(403).json({ error: 'Solo superadmin' })
    const { provider } = req.body
    if (provider !== 'anthropic' && provider !== 'openrouter') return res.status(400).json({ error: 'Proveedor no válido' })
    const { setActiveProvider } = await import('../lib/aiProviders')
    await setActiveProvider(provider)
    return res.json({ provider })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET/PUT /api/clinic-config/issuer-tax-id — NIF/CIF de ConsentsPro que
// aparece en las facturas propias de suscripción (routes/billing.ts,
// invoice.paid). No se puede leer en vivo de la API de Stripe (solo
// confirma si está puesto, no el valor) — se configura aquí una vez.
router.get('/issuer-tax-id', async (req, res) => {
  try {
    if (!(await isSuperAdmin(req))) return res.status(403).json({ error: 'Solo superadmin' })
    const row = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'consentspro_issuer_tax_id'")
    return res.json({ taxId: row?.value ?? '' })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/issuer-tax-id', async (req, res) => {
  try {
    if (!(await isSuperAdmin(req))) return res.status(403).json({ error: 'Solo superadmin' })
    const { taxId } = req.body
    if (typeof taxId !== 'string' || !taxId.trim()) return res.status(400).json({ error: 'NIF/CIF requerido' })
    await query(
      `INSERT INTO system_settings (key, value) VALUES ('consentspro_issuer_tax_id', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [taxId.trim()]
    )
    return res.json({ taxId: taxId.trim() })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET/PUT /api/clinic-config/shared-ycloud-key — API Key única de YCloud
// para TODAS las clínicas (ya no existe una clave de YCloud por clínica —
// ver migración 063).
router.get('/shared-ycloud-key', async (req, res) => {
  try {
    if (!(await isSuperAdmin(req))) return res.status(403).json({ error: 'Solo superadmin' })
    const row = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'shared_ycloud_api_key'")
    return res.json({ configured: !!row?.value?.trim() })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/shared-ycloud-key', async (req, res) => {
  try {
    if (!(await isSuperAdmin(req))) return res.status(403).json({ error: 'Solo superadmin' })
    const { apiKey } = req.body
    if (typeof apiKey !== 'string' || !apiKey.trim()) return res.status(400).json({ error: 'API Key requerida' })
    await query(
      `INSERT INTO system_settings (key, value) VALUES ('shared_ycloud_api_key', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [apiKey.trim()]
    )
    return res.json({ configured: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET/PUT /api/clinic-config/system-retell-key — API Key única de Retell
// para TODAS las clínicas (routes/retell.ts la usa para sincronizar el
// agente de voz de cada clínica) — ya no existe una clave de Retell por
// clínica (ver migración 063).
router.get('/system-retell-key', async (req, res) => {
  try {
    if (!(await isSuperAdmin(req))) return res.status(403).json({ error: 'Solo superadmin' })
    const row = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'system_retell_api_key'")
    return res.json({ configured: !!row?.value?.trim() })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/system-retell-key', async (req, res) => {
  try {
    if (!(await isSuperAdmin(req))) return res.status(403).json({ error: 'Solo superadmin' })
    const { apiKey } = req.body
    if (typeof apiKey !== 'string' || !apiKey.trim()) return res.status(400).json({ error: 'API Key requerida' })
    await query(
      `INSERT INTO system_settings (key, value) VALUES ('system_retell_api_key', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [apiKey.trim()]
    )
    return res.json({ configured: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
