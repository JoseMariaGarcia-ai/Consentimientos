import { Router } from 'express'
import { query, queryOne, withTransaction } from '../lib/db'
import { parseCertificateMetadata } from '../lib/certificateParsing'
import { encryptCertificateFile, encryptCertificatePassword } from '../lib/certificateEncryption'
import { logCertificateAccess } from '../lib/certificateAuditLog'
import { getAeatMode } from '../lib/certificateGuard'
import { requireClinicaAdmin } from '../middleware/auth'

const router = Router()

async function getClinicId(userId: string): Promise<string | null> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  return row?.clinic_id ?? null
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

function publicCertificate(row: any) {
  return {
    id: row.id,
    issuer: row.issuer,
    subject_name: row.subject_name,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    status: row.status,
    uploaded_at: row.uploaded_at,
    last_used_at: row.last_used_at,
    days_until_expiry: daysUntil(row.valid_until),
  }
}

// GET /api/clinic-certificates/mode — visible para cualquier usuario con
// acceso al módulo de facturación (para el banner persistente de modo
// prueba), no solo el admin de la clínica.
router.get('/mode', async (_req, res) => {
  res.json({ mode: getAeatMode() })
})

// GET /api/clinic-certificates/status — certificado activo de la clínica
// del usuario (solo admin de esa clínica). Nunca incluye el archivo ni la
// contraseña, cifrados o no.
router.get('/status', requireClinicaAdmin, async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const cert = await queryOne<any>(
      `SELECT * FROM clinic_digital_certificates
       WHERE clinic_id = $1 AND environment = 'production' AND status = 'activo'
       ORDER BY uploaded_at DESC LIMIT 1`,
      [clinicId]
    )
    return res.json({ certificate: cert ? publicCertificate(cert) : null, mode: getAeatMode() })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/clinic-certificates — sube (o sustituye) el certificado de
// producción de la clínica. El anterior activo (si existe) pasa a
// 'historico', nunca se borra. El archivo y la contraseña se cifran con
// AES-256-GCM y claves distintas antes de guardarse; ninguno de los dos
// vuelve a estar accesible en claro después de esta petición.
router.post('/', requireClinicaAdmin, async (req, res) => {
  const { userId } = (req as any).user
  const { file_base64, file_name, password } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    if (!file_base64) return res.status(400).json({ error: 'El archivo del certificado (.p12/.pfx) es obligatorio' })
    if (!password) return res.status(400).json({ error: 'La contraseña del certificado es obligatoria' })
    const name = String(file_name ?? '').toLowerCase()
    if (name && !name.endsWith('.p12') && !name.endsWith('.pfx')) {
      return res.status(400).json({ error: 'El archivo debe ser un certificado .p12 o .pfx' })
    }

    let fileBuffer: Buffer
    try {
      fileBuffer = Buffer.from(file_base64, 'base64')
    } catch {
      return res.status(400).json({ error: 'El archivo no se ha podido leer' })
    }

    const metadata = parseCertificateMetadata(fileBuffer, password)
    if (metadata.validUntil < new Date()) {
      return res.status(400).json({ error: 'Este certificado ya está caducado — no se puede cargar' })
    }

    const fileEnc = encryptCertificateFile(fileBuffer)
    const passEnc = encryptCertificatePassword(String(password))

    const inserted = await withTransaction(async client => {
      await client.query(
        `UPDATE clinic_digital_certificates SET status = 'historico'
         WHERE clinic_id = $1 AND environment = 'production' AND status = 'activo'`,
        [clinicId]
      )
      const { rows } = await client.query(
        `INSERT INTO clinic_digital_certificates (
           clinic_id, environment, certificate_encrypted, certificate_iv, certificate_auth_tag,
           certificate_password_encrypted, certificate_password_iv, certificate_password_auth_tag,
           issuer, subject_name, valid_from, valid_until, status, uploaded_by
         ) VALUES ($1,'production',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'activo',$12)
         RETURNING *`,
        [
          clinicId, fileEnc.ciphertext, fileEnc.iv, fileEnc.authTag,
          passEnc.ciphertext.toString('hex'), passEnc.iv, passEnc.authTag,
          metadata.issuer, metadata.subjectName,
          metadata.validFrom.toISOString().slice(0, 10), metadata.validUntil.toISOString().slice(0, 10),
          userId,
        ]
      )
      return rows[0]
    })

    await logCertificateAccess({
      clinicId, certificateId: inserted.id, action: 'subida', performedBy: userId, ip: req.ip,
      detail: `Certificado emitido por ${metadata.issuer}, válido hasta ${metadata.validUntil.toISOString().slice(0, 10)}`,
    })

    return res.status(201).json({ certificate: publicCertificate(inserted) })
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

export default router
