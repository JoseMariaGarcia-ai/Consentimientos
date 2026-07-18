import { queryOne } from './db'
import { logCertificateAccess } from './certificateAuditLog'

export interface CertificateRow {
  id: string
  clinic_id: string | null
  environment: 'production' | 'test'
  certificate_encrypted: Buffer
  certificate_iv: string
  certificate_auth_tag: string
  certificate_password_encrypted: string
  certificate_password_iv: string
  certificate_password_auth_tag: string
  issuer: string | null
  subject_name: string | null
  valid_from: string
  valid_until: string
  status: string
}

export function getAeatMode(): 'test' | 'production' {
  return process.env.AEAT_MODE === 'production' ? 'production' : 'test'
}

export function getAeatUrl(): string | undefined {
  return getAeatMode() === 'production' ? process.env.AEAT_URL_PRODUCTION : process.env.AEAT_URL_TEST
}

async function getActiveClinicCertificate(clinicId: string): Promise<CertificateRow | null> {
  return queryOne<CertificateRow>(
    `SELECT * FROM clinic_digital_certificates
     WHERE clinic_id = $1 AND environment = 'production' AND status = 'activo' AND valid_until >= CURRENT_DATE
     ORDER BY uploaded_at DESC LIMIT 1`,
    [clinicId]
  )
}

// Hay certificado real, activo y sin caducar para esa clínica. Es la
// comprobación que debe usarse antes de emitir cualquier factura VeriFactu
// en AEAT_MODE=production (punto 4 del documento de ampliación) — ver nota
// en invoices.ts sobre por qué todavía no está conectada ahí.
export async function hasValidCertificate(clinicId: string): Promise<boolean> {
  return !!(await getActiveClinicCertificate(clinicId))
}

// Resuelve el certificado a usar para conectar con la AEAT, aplicando el
// bloqueo cruzado obligatorio (6.4): en modo test SOLO puede usarse el
// certificado de prueba a nivel de sistema (clinic_id NULL, environment=
// 'test'); en modo producción SOLO el certificado real de la clínica
// (environment='production'). Cualquier desajuste lanza un error explícito
// y queda registrado — nunca falla en silencio.
export async function resolveCertificateForSubmission(
  clinicId: string,
  opts: { ip?: string | null; performedBy?: string | null } = {}
): Promise<CertificateRow> {
  const mode = getAeatMode()

  if (mode === 'test') {
    const testCert = await queryOne<CertificateRow>(
      `SELECT * FROM clinic_digital_certificates
       WHERE clinic_id IS NULL AND environment = 'test' AND status = 'activo' AND valid_until >= CURRENT_DATE
       ORDER BY uploaded_at DESC LIMIT 1`
    )
    if (!testCert) {
      await logCertificateAccess({
        clinicId, action: 'bloqueo_cruzado', performedBy: opts.performedBy, ip: opts.ip,
        detail: 'AEAT_MODE=test pero no hay certificado de prueba de sistema activo',
      })
      throw Object.assign(new Error('No hay certificado de prueba configurado a nivel de sistema para AEAT_MODE=test'), { status: 409 })
    }
    return testCert
  }

  const prodCert = await getActiveClinicCertificate(clinicId)
  if (!prodCert) {
    await logCertificateAccess({
      clinicId, action: 'bloqueo_cruzado', performedBy: opts.performedBy, ip: opts.ip,
      detail: 'AEAT_MODE=production pero la clínica no tiene certificado de producción activo',
    })
    throw Object.assign(new Error('La clínica no tiene un certificado digital válido — configúralo en Facturación > Certificado Digital'), { status: 409 })
  }
  if (prodCert.environment !== 'production') {
    await logCertificateAccess({
      clinicId, certificateId: prodCert.id, action: 'bloqueo_cruzado', performedBy: opts.performedBy, ip: opts.ip,
      detail: 'Certificado con environment=test rechazado en AEAT_MODE=production',
    })
    throw Object.assign(new Error('Certificado de entorno de prueba rechazado en modo producción'), { status: 409 })
  }
  return prodCert
}

// Punto de bloqueo de emisión (punto 4 del documento): antes de generar
// cualquier factura VeriFactu en modo producción, exigir un certificado
// válido. DELIBERADAMENTE NO se llama todavía desde invoices.ts — hacerlo
// ahora bloquearía a todas las clínicas existentes (ninguna tiene
// certificado cargado aún) para una integración con la AEAT que sigue
// siendo un stub (ver aeatSubmission.ts). Se activa cuando AEAT_MODE pase a
// 'production' y el envío real esté conectado.
export async function assertCertificateForInvoiceEmission(clinicId: string): Promise<void> {
  if (getAeatMode() !== 'production') return
  const valid = await hasValidCertificate(clinicId)
  if (!valid) {
    throw Object.assign(
      new Error('La clínica no tiene un certificado digital válido — configúralo en Facturación > Certificado Digital antes de emitir facturas VeriFactu'),
      { status: 409 }
    )
  }
}
