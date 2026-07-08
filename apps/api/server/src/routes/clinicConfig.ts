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

// PUT /api/clinic-config — superadmin only
router.put('/', async (req, res) => {
  try {
    const { targetClinicId, ycloud_api_key, anthropic_api_key, retell_api_key, make_api_key, knowledge_base, prompt } = req.body
    const clinicId = await requireSuperAdminClinicId(req, targetClinicId)
    if (!clinicId) return res.status(403).json({ error: 'Solo superadmin' })
    const data = await queryOne(
      `INSERT INTO clinic_api_config (clinic_id, ycloud_api_key, anthropic_api_key, retell_api_key, make_api_key, knowledge_base, prompt, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (clinic_id) DO UPDATE SET
         ycloud_api_key=$2, anthropic_api_key=$3, retell_api_key=$4, make_api_key=$5,
         knowledge_base=$6, prompt=$7, updated_at=NOW()
       RETURNING *`,
      [clinicId, ycloud_api_key ?? null, anthropic_api_key ?? null, retell_api_key ?? null,
       make_api_key ?? null, knowledge_base ?? null, prompt ?? null]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
