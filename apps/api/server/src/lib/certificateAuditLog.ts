import { query } from './db'

export type CertificateAccessAction = 'subida' | 'uso_para_firma' | 'renovacion' | 'eliminacion' | 'bloqueo_cruzado'

interface LogCertificateAccessInput {
  clinicId: string | null
  certificateId?: string | null
  action: CertificateAccessAction
  invoiceId?: string | null
  performedBy?: string | null
  ip?: string | null
  detail?: string | null
}

// Log de auditoría inmutable (nunca se actualiza ni se borra) de todo
// acceso al certificado digital de una clínica: subida, uso para firmar un
// envío a la AEAT, renovación, eliminación o un intento bloqueado por
// desajuste entre AEAT_MODE y el entorno del certificado.
export async function logCertificateAccess(input: LogCertificateAccessInput) {
  await query(
    `INSERT INTO certificate_access_log (clinic_id, certificate_id, action, invoice_id, performed_by, ip_address, detail)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      input.clinicId, input.certificateId ?? null, input.action,
      input.invoiceId ?? null, input.performedBy ?? null, input.ip ?? null, input.detail ?? null,
    ]
  )
}
