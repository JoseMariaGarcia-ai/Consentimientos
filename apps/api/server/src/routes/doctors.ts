import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { uploadFile, getPresignedUrl } from '../lib/r2'

const router = Router()

// URL firmada de larga duración — el listado de doctores no se recarga con
// tanta frecuencia como las fotos de pacientes, así que 6h evita que la
// imagen se rompa en una sesión larga sin tener que ir refrescando.
const PHOTO_URL_EXPIRY = 6 * 60 * 60

async function withPhotoUrl(doctor: any) {
  if (!doctor?.photo_key) return doctor
  try {
    return { ...doctor, photo_url: await getPresignedUrl(doctor.photo_key, PHOTO_URL_EXPIRY) }
  } catch (err: any) {
    // No dejar que un fallo al firmar la URL de la foto (p. ej. credenciales
    // R2 mal configuradas) tumbe toda la respuesta — el doctor ya se guardó
    // correctamente, simplemente se devuelve sin foto en vez de con error 500.
    console.error('[doctors] error generando URL firmada de la foto:', err.message)
    return doctor
  }
}

router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const data = await query(
      `SELECT * FROM doctors WHERE clinic_id = (SELECT clinic_id FROM app_users WHERE id = $1) ORDER BY created_at DESC`,
      [userId]
    )
    const withUrls = await Promise.all((data as any[]).map(withPhotoUrl))
    return res.json(withUrls)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /doctors/photo — sube la foto a R2 y devuelve la clave + URL para
// previsualizar antes de guardar el doctor (necesario porque en un doctor
// nuevo todavía no existe un id al que asociar el archivo).
router.post('/photo', async (req, res) => {
  try {
    const { fileBase64, fileName, contentType } = req.body
    if (!fileBase64 || !fileName) return res.status(400).json({ error: 'fileBase64 y fileName requeridos' })
    const buffer = Buffer.from(fileBase64, 'base64')
    const key = `doctors/photos/${Date.now()}_${fileName}`
    await uploadFile(key, buffer, contentType ?? 'image/jpeg')
    const url = await getPresignedUrl(key, PHOTO_URL_EXPIRY)
    return res.status(201).json({ key, url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const b = req.body
    const license_number = b.license_number ?? b.licenseNumber ?? null
    const photo_key = b.photo_key ?? b.photoKey ?? null
    const { name, specialty, email, phone, role } = b
    const data = await queryOne(
      `INSERT INTO doctors (clinic_id, name, specialty, license_number, phone, email, role, photo_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [clinicRow?.clinic_id, name, specialty, license_number, phone ?? null, email, role ?? 'doctor', photo_key]
    )
    return res.status(201).json(await withPhotoUrl(data))
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  const { userId } = (req as any).user
  const b = req.body
  const license_number = b.license_number ?? b.licenseNumber ?? null
  const photo_key = b.photo_key ?? b.photoKey ?? null
  const { name, specialty, email, phone, role } = b
  try {
    const data = await queryOne(
      `UPDATE doctors SET name=$1, specialty=$2, license_number=$3, phone=$4, email=$5, role=$6, photo_key=$7
       WHERE id=$8 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $9) RETURNING *`,
      [name, specialty, license_number, phone ?? null, email, role, photo_key, req.params.id, userId]
    )
    if (!data) return res.status(404).json({ error: 'Doctor no encontrado' })
    return res.json(await withPhotoUrl(data))
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const data = await queryOne(
      'DELETE FROM doctors WHERE id = $1 AND clinic_id = (SELECT clinic_id FROM app_users WHERE id = $2) RETURNING id',
      [req.params.id, userId]
    )
    if (!data) return res.status(404).json({ error: 'Doctor no encontrado' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
