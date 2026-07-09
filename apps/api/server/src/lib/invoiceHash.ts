import crypto from 'crypto'

export interface HashInput {
  nifEmisor: string
  invoiceNumber: string // serie + número, ej. A-0001
  issueDate: string // ISO
  recordType: 'alta' | 'anulacion'
  totalAmount: number
  previousHash: string | null
  timestamp: string // ISO, generado en el momento del cálculo
}

// Cadena de campos concatenados, en el orden que especifica el RRSIF:
// NIF emisor + número/serie + fecha expedición + tipo de registro +
// importe total + hash del registro anterior (cadena vacía si es el
// primero de la clínica) + fecha/hora de generación del propio registro.
export function computeRecordHash(input: HashInput): string {
  const cadena =
    `${input.nifEmisor}${input.invoiceNumber}${input.issueDate}${input.recordType}` +
    `${input.totalAmount.toFixed(2)}${input.previousHash ?? ''}${input.timestamp}`
  return crypto.createHash('sha256').update(cadena).digest('hex')
}
