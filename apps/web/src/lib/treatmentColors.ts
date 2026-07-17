// Paleta de colores suaves para tratamientos, usada para diferenciarlos en
// la agenda. Se guardan solo las CLAVES (no hex en bruto) para que la
// paleta se pueda ajustar en un único sitio sin migrar datos, y para que
// el selector de color en Tratamientos solo ofrezca tonos ya curados
// (nunca colores saturados/chillones).
export interface TreatmentColorDef {
  bg: string
  border: string
  text: string
}

export const TREATMENT_COLORS: Record<string, TreatmentColorDef> = {
  // El azul es el que ya usaba la agenda por defecto para las citas.
  blue:    { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' },
  emerald: { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' },
  amber:   { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' },
  rose:    { bg: '#FFE4E6', border: '#FDA4AF', text: '#9F1239' },
  violet:  { bg: '#EDE9FE', border: '#C4B5FD', text: '#5B21B6' },
  cyan:    { bg: '#CFFAFE', border: '#67E8F9', text: '#155E75' },
  orange:  { bg: '#FFEDD5', border: '#FDBA74', text: '#9A3412' },
  pink:    { bg: '#FCE7F3', border: '#F9A8D4', text: '#9D174D' },
}

export const DEFAULT_TREATMENT_COLOR = 'blue'

export const TREATMENT_COLOR_KEYS = Object.keys(TREATMENT_COLORS)

export function treatmentColorDef(key?: string | null): TreatmentColorDef {
  return TREATMENT_COLORS[key ?? ''] ?? TREATMENT_COLORS[DEFAULT_TREATMENT_COLOR]
}

export function treatmentColorStyle(key?: string | null): { backgroundColor: string; borderColor: string; color: string } {
  const c = treatmentColorDef(key)
  return { backgroundColor: c.bg, borderColor: c.border, color: c.text }
}
