import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { uploadFile, getPresignedUrl } from '../lib/r2'
import { requireClinicaAdmin } from '../middleware/auth'
import { ALL_MODULES, applyUserPermissions, defaultDoctorPermissions } from '../lib/planPermissions'
import { sendInviteEmail } from '../lib/inviteEmail'

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

// Crea (o reutiliza si ya existe en ESTA misma clínica) la cuenta de acceso
// del doctor y le manda la invitación — nunca lanza: un fallo aquí no debe
// impedir que el doctor se haya guardado correctamente en el directorio.
async function provisionDoctorAccount(doctorId: string, clinicId: string, name: string, email: string) {
  try {
    const existing = await queryOne<{ id: string; clinic_id: string | null }>(
      'SELECT id, clinic_id FROM app_users WHERE lower(email) = lower($1)', [email]
    )
    if (existing && existing.clinic_id !== clinicId) {
      // Email ya usado por una cuenta de otra clínica — no se toca, el
      // doctor queda guardado sin cuenta de acceso (se puede invitar más
      // tarde desde el panel con otro email, o resolverlo a mano).
      console.error(`[doctors] no se pudo crear la cuenta de ${email}: ya existe en otra clínica`)
      return
    }
    let appUserId = existing?.id ?? null
    if (!appUserId) {
      const newUser = await queryOne<{ id: string }>(
        `INSERT INTO app_users (email, full_name, role, clinic_id) VALUES ($1,$2,'doctor',$3) RETURNING id`,
        [email, name, clinicId]
      )
      appUserId = newUser!.id
      await applyUserPermissions(appUserId, defaultDoctorPermissions())
    }
    await query('UPDATE doctors SET app_user_id = $1 WHERE id = $2', [appUserId, doctorId])
    const clinic = await queryOne<{ name: string; trade_name: string | null }>('SELECT name, trade_name FROM clinics WHERE id = $1', [clinicId])
    await sendInviteEmail({ id: appUserId, email, full_name: name, role: 'doctor' }, clinic?.trade_name ?? clinic?.name ?? null)
  } catch (err: any) {
    console.error('[doctors] fallo creando la cuenta de acceso del doctor:', err.message)
  }
}

router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinicId = clinicRow?.clinic_id
    const b = req.body
    const license_number = b.license_number ?? b.licenseNumber ?? null
    const photo_key = b.photo_key ?? b.photoKey ?? null
    const { name, specialty, email, phone, role } = b
    const data: any = await queryOne(
      `INSERT INTO doctors (clinic_id, name, specialty, license_number, phone, email, role, photo_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [clinicId, name, specialty, license_number, phone ?? null, email, role ?? 'doctor', photo_key]
    )

    // El acceso a la app (rol "doctor" en app_users, con sus propios
    // permisos por sección y su propia agenda) se crea automáticamente al
    // dar de alta el doctor — la clínica ajusta los permisos después desde
    // Clínica > Doctores y permisos.
    if (email && clinicId) {
      await provisionDoctorAccount(data.id, clinicId, name, email)
      data.app_user_id = (await queryOne<{ app_user_id: string | null }>('SELECT app_user_id FROM doctors WHERE id = $1', [data.id]))?.app_user_id ?? null
    }

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

// GET /doctors/:id/permissions — módulos permitidos + si puede ver todas las
// agendas. Solo el titular de la clínica (o superadmin) puede consultarlo,
// nunca otro doctor ni recepción — reutiliza requireClinicaAdmin, el mismo
// guard que ya protege el certificado digital de la clínica.
router.get('/:id/permissions', requireClinicaAdmin, async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const doctor = await queryOne<{ id: string; app_user_id: string | null; can_view_all_agendas: boolean }>(
      'SELECT id, app_user_id, can_view_all_agendas FROM doctors WHERE id = $1 AND clinic_id = $2',
      [req.params.id, clinicRow?.clinic_id]
    )
    if (!doctor) return res.status(404).json({ error: 'Doctor no encontrado' })
    if (!doctor.app_user_id) {
      return res.json({ hasAccount: false, permissions: {}, canViewAllAgendas: doctor.can_view_all_agendas })
    }
    const rows = await query<{ module: string; can_access: boolean }>(
      'SELECT module, can_access FROM user_permissions WHERE user_id = $1', [doctor.app_user_id]
    )
    const permissions = Object.fromEntries(ALL_MODULES.map(m => [m, false]))
    for (const r of rows) permissions[r.module] = r.can_access
    return res.json({ hasAccount: true, permissions, canViewAllAgendas: doctor.can_view_all_agendas })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// PUT /doctors/:id/permissions — { permissions: Record<string,boolean>, canViewAllAgendas: boolean }
router.put('/:id/permissions', requireClinicaAdmin, async (req, res) => {
  const { userId } = (req as any).user
  const { permissions, canViewAllAgendas } = req.body
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const doctor = await queryOne<{ id: string; app_user_id: string | null }>(
      'SELECT id, app_user_id FROM doctors WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicRow?.clinic_id]
    )
    if (!doctor) return res.status(404).json({ error: 'Doctor no encontrado' })
    if (doctor.app_user_id && permissions) {
      await applyUserPermissions(doctor.app_user_id, permissions)
    }
    if (typeof canViewAllAgendas === 'boolean') {
      await query('UPDATE doctors SET can_view_all_agendas = $1 WHERE id = $2', [canViewAllAgendas, doctor.id])
    }
    return res.json({ updated: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /doctors/:id/invite — crea (si hace falta) la cuenta de acceso del
// doctor y (re)envía la invitación. Cubre tanto doctores dados de alta antes
// de esta funcionalidad (sin cuenta todavía) como reenviar un enlace que ya
// haya caducado (24h).
router.post('/:id/invite', requireClinicaAdmin, async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicRow = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    const clinicId = clinicRow?.clinic_id
    const doctor = await queryOne<any>('SELECT * FROM doctors WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!doctor) return res.status(404).json({ error: 'Doctor no encontrado' })
    if (!doctor.email) return res.status(400).json({ error: 'Este doctor no tiene email — añádelo primero para poder invitarlo' })
    if (!clinicId) return res.status(400).json({ error: 'Usuario sin clínica asignada' })

    if (!doctor.app_user_id) {
      await provisionDoctorAccount(doctor.id, clinicId, doctor.name, doctor.email)
    } else {
      const clinic = await queryOne<{ name: string; trade_name: string | null }>('SELECT name, trade_name FROM clinics WHERE id = $1', [clinicId])
      await sendInviteEmail({ id: doctor.app_user_id, email: doctor.email, full_name: doctor.name, role: 'doctor' }, clinic?.trade_name ?? clinic?.name ?? null)
    }
    return res.json({ invited: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
