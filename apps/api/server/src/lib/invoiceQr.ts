// Contenido del código QR VERI*FACTU (Orden HAC/1177/2024 · ISO/IEC 18004).
//
// ⚠️ PENDIENTE DE VERIFICAR: el formato exacto de la URL de validación (el
// dominio, los nombres de parámetro y su orden) lo publica la AEAT en su
// Sede Electrónica y puede variar entre versiones del reglamento. El qr_content
// que se genera aquí incluye los cuatro campos que exige el RRSIF (NIF emisor,
// número+serie, fecha de expedición e importe total) con nombres de parámetro
// provisionales — antes de depender de este QR para una presentación real
// ante la AEAT, contrastar el formato con la documentación técnica vigente
// (apartado "Sistemas informáticos de facturación VERI*FACTU").
const AEAT_VERIFICATION_BASE_URL = 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR'

export interface QrInput {
  nifEmisor: string
  invoiceNumber: string // serie + número, ej. A-0001
  issueDate: string // YYYY-MM-DD
  totalAmount: number
}

export function buildQrContent(input: QrInput): string {
  const params = new URLSearchParams({
    nif: input.nifEmisor,
    numserie: input.invoiceNumber,
    fecha: input.issueDate,
    importe: input.totalAmount.toFixed(2),
  })
  return `${AEAT_VERIFICATION_BASE_URL}?${params.toString()}`
}
