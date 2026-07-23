import { Router } from 'express'
import { queryOne } from '../lib/db'
import { uploadFile, getPresignedUrl } from '../lib/r2'

const router = Router()

// El logo se ve en el portal del paciente potencialmente durante mucho
// tiempo entre visitas — caducidad más larga que la foto de un doctor
// (6h), pero se re-resuelve en cada GET, así que nunca llega a caducar
// mientras la página siga pidiendo los datos de la clínica.
const LOGO_URL_EXPIRY = 24 * 60 * 60

router.get('/', async (req, res) => {
  const { clinicId } = (req as any).user
  try {
    const data = await queryOne<any>('SELECT * FROM clinics WHERE id = $1', [clinicId])
    if (data?.logo_key) data.logo_url = await getPresignedUrl(data.logo_key, LOGO_URL_EXPIRY)
    return res.json(data ?? {})
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /clinic/logo — sube el logo a R2 y devuelve la clave + URL para
// previsualizar antes de guardar (mismo patrón que POST /doctors/photo).
router.post('/logo', async (req, res) => {
  const { clinicId } = (req as any).user
  try {
    const { fileBase64, fileName, contentType } = req.body
    if (!fileBase64 || !fileName) return res.status(400).json({ error: 'fileBase64 y fileName requeridos' })
    const buffer = Buffer.from(fileBase64, 'base64')
    const key = `clinics/logos/${clinicId}_${Date.now()}_${fileName}`
    await uploadFile(key, buffer, contentType ?? 'image/jpeg')
    const url = await getPresignedUrl(key, LOGO_URL_EXPIRY)
    return res.status(201).json({ key, url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/', async (req, res) => {
  const { clinicId } = (req as any).user
  const { name, address, phone, email, tax_id, taxId, logo_url, logo_key, legal_name, legalName, trade_name, tradeName, nika_number, nikaNumber, directions_url, directionsUrl, city, province } = req.body
  try {
    const data = await queryOne<any>(
      `UPDATE clinics SET name=$1, address=$2, phone=$3, email=$4, tax_id=$5, logo_url=$6, logo_key=$7, legal_name=$8, trade_name=$9, nika_number=$10, directions_url=$11, city=$12, province=$13 WHERE id=$14 RETURNING *`,
      [name, address, phone, email, tax_id ?? taxId, logo_url, logo_key ?? null, legal_name ?? legalName ?? null, trade_name ?? tradeName ?? null, nika_number ?? nikaNumber ?? null, directions_url ?? directionsUrl ?? null, city ?? null, province ?? null, clinicId]
    )
    if (data?.logo_key) data.logo_url = await getPresignedUrl(data.logo_key, LOGO_URL_EXPIRY)
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
