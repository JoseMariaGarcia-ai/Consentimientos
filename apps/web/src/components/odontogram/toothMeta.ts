import type { OdontogramTooth, ToothFaceCondition, ToothFaceName, ToothStatus } from '@consentspro/shared-types'

// Notación FDI/ISO 3950 — orden de visualización tal como se ve
// clínicamente (el lado derecho del paciente aparece a la izquierda del
// gráfico, igual que si el profesional estuviera mirando de frente al
// paciente).
export const PERMANENT_QUADRANTS: string[][] = [
  ['18', '17', '16', '15', '14', '13', '12', '11'], // superior derecho
  ['21', '22', '23', '24', '25', '26', '27', '28'], // superior izquierdo
  ['48', '47', '46', '45', '44', '43', '42', '41'], // inferior derecho
  ['31', '32', '33', '34', '35', '36', '37', '38'], // inferior izquierdo
]

export const TEMPORARY_QUADRANTS: string[][] = [
  ['55', '54', '53', '52', '51'], // superior derecho
  ['61', '62', '63', '64', '65'], // superior izquierdo
  ['85', '84', '83', '82', '81'], // inferior derecho
  ['71', '72', '73', '74', '75'], // inferior izquierdo
]

const PERMANENT_POSITION_NAME: Record<string, string> = {
  '1': 'Incisivo central', '2': 'Incisivo lateral', '3': 'Canino',
  '4': 'Primer premolar', '5': 'Segundo premolar',
  '6': 'Primer molar', '7': 'Segundo molar', '8': 'Tercer molar (muela del juicio)',
}
const TEMPORARY_POSITION_NAME: Record<string, string> = {
  '1': 'Incisivo central temporal', '2': 'Incisivo lateral temporal', '3': 'Canino temporal',
  '4': 'Primer molar temporal', '5': 'Segundo molar temporal',
}
const QUADRANT_SIDE: Record<string, string> = {
  '1': 'superior derecho', '2': 'superior izquierdo', '3': 'inferior izquierdo', '4': 'inferior derecho',
  '5': 'superior derecho', '6': 'superior izquierdo', '7': 'inferior izquierdo', '8': 'inferior derecho',
}

export function toothName(number: string): string {
  const [q, pos] = number.split('')
  const isTemp = Number(q) >= 5
  const posName = (isTemp ? TEMPORARY_POSITION_NAME : PERMANENT_POSITION_NAME)[pos] ?? 'Diente'
  return `${posName} ${QUADRANT_SIDE[q] ?? ''}`.trim()
}

export const FACE_NAMES: ToothFaceName[] = ['vestibular', 'lingual_palatina', 'mesial', 'distal', 'oclusal_incisal']

export const FACE_LABELS: Record<ToothFaceName, string> = {
  vestibular: 'Vestibular',
  lingual_palatina: 'Lingual/Palatina',
  mesial: 'Mesial',
  distal: 'Distal',
  oclusal_incisal: 'Oclusal/Incisal',
}

export const FACE_CONDITIONS: ToothFaceCondition[] = ['sana', 'caries', 'obturada', 'sellante', 'fractura', 'desgaste']

export const FACE_CONDITION_LABELS: Record<ToothFaceCondition, string> = {
  sana: 'Sana', caries: 'Caries', obturada: 'Obturada', sellante: 'Sellante', fractura: 'Fractura', desgaste: 'Desgaste',
}

// Colores estándar de la leyenda del odontograma.
export const FACE_CONDITION_COLOR: Record<ToothFaceCondition, string> = {
  sana: '#FFFFFF',
  caries: '#EF4444',
  obturada: '#3B82F6',
  sellante: '#38BDF8',
  fractura: '#F97316',
  desgaste: '#FBBF24',
}

export const TOOTH_STATUSES: ToothStatus[] = [
  'sano', 'ausente', 'extraido', 'a_extraer', 'implante', 'corona',
  'puente', 'endodoncia', 'movil', 'incluido', 'temporal_presente',
]

export const TOOTH_STATUS_LABELS: Record<ToothStatus, string> = {
  sano: 'Sano', ausente: 'Ausente (congénito)', extraido: 'Extraído', a_extraer: 'A extraer',
  implante: 'Implante', corona: 'Corona', puente: 'Puente', endodoncia: 'Endodoncia',
  movil: 'Móvil', incluido: 'Incluido (retenido)', temporal_presente: 'Temporal presente',
}

// Badge corto superpuesto sobre el diente para los estados generales que no
// se representan bien solo con color de cara (corona, implante, etc.).
export const TOOTH_STATUS_BADGE: Partial<Record<ToothStatus, { text: string; color: string }>> = {
  implante: { text: 'IM', color: '#C9A84C' },
  corona: { text: 'CO', color: '#C9A84C' },
  puente: { text: 'PU', color: '#8B5CF6' },
  endodoncia: { text: 'EN', color: '#7C3AED' },
  movil: { text: 'MO', color: '#F97316' },
  incluido: { text: 'IN', color: '#64748B' },
  a_extraer: { text: 'AX', color: '#EAB308' },
}

export const TOOTH_MATERIALS = ['composite', 'amalgama', 'ceramica', 'resina']

export function emptyFaces(): OdontogramTooth['faces'] {
  const faces = {} as OdontogramTooth['faces']
  for (const f of FACE_NAMES) faces[f] = { condition: 'sana', material: null }
  return faces
}

export function emptyTooth(number: string): OdontogramTooth {
  return { number, status: 'sano', material: null, notes: '', faces: emptyFaces() }
}

export function allToothNumbers(dentitionType: 'permanente' | 'temporal' | 'mixta'): string[] {
  const perm = PERMANENT_QUADRANTS.flat()
  const temp = TEMPORARY_QUADRANTS.flat()
  if (dentitionType === 'permanente') return perm
  if (dentitionType === 'temporal') return temp
  return [...perm, ...temp]
}

// Un diente se considera "distinto" entre dos visitas si cambió su estado
// general o el de cualquiera de sus 5 caras.
export function toothChanged(a: OdontogramTooth | undefined, b: OdontogramTooth | undefined): boolean {
  if (!a || !b) return a !== b
  if (a.status !== b.status) return true
  for (const f of FACE_NAMES) {
    if (a.faces[f]?.condition !== b.faces[f]?.condition) return true
    if (a.faces[f]?.material !== b.faces[f]?.material) return true
  }
  return false
}
