import crypto from 'crypto'

export interface TimeHashInput {
  employeeId: string
  recordType: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa'
  timestampUtc: string // ISO
  latitude: number | null
  longitude: number | null
  previousHash: string | null
}

// Cadena por empleado (no por clínica): cada nuevo fichaje se encadena al
// fichaje anterior de ESE MISMO empleado, así que la cadena de un empleado
// no se ve afectada por los fichajes de sus compañeros.
export function computeTimeRecordHash(input: TimeHashInput): string {
  const cadena =
    `${input.employeeId}${input.recordType}${input.timestampUtc}` +
    `${input.latitude ?? ''}${input.longitude ?? ''}${input.previousHash ?? ''}`
  return crypto.createHash('sha256').update(cadena).digest('hex')
}
