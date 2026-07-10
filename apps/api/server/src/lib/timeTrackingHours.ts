// Cálculo de horas trabajadas y horas extra a partir de los fichajes.
//
// Simplificación deliberada: se usa un umbral de 8h/día para marcar
// "extra". La legislación española real depende del convenio colectivo
// aplicable (jornada anual, cómputo semanal, etc.), que este módulo no
// conoce — el campo de compensación (overtime_compensations) es lo que
// realmente queda como registro legal editable por el responsable; este
// cálculo es solo una ayuda visual en el panel.
const STANDARD_DAILY_HOURS = 8

export interface TimeRecordLike {
  record_type: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa'
  timestamp_utc: string | Date
}

export interface DayTotal {
  date: string // YYYY-MM-DD
  hours: number
  overtimeHours: number
}

function toDate(v: string | Date): Date {
  return v instanceof Date ? v : new Date(v)
}

// Los registros deben venir ya ordenados cronológicamente y pertenecer a
// UN SOLO empleado.
export function computeWorkedHours(records: TimeRecordLike[]): DayTotal[] {
  const byDay = new Map<string, number>() // ms trabajados por día
  let shiftStart: Date | null = null
  let pauseStart: Date | null = null
  let pauseMsThisShift = 0

  for (const rec of records) {
    const t = toDate(rec.timestamp_utc)
    if (rec.record_type === 'entrada') {
      shiftStart = t
      pauseMsThisShift = 0
      pauseStart = null
    } else if (rec.record_type === 'inicio_pausa') {
      if (shiftStart) pauseStart = t
    } else if (rec.record_type === 'fin_pausa') {
      if (pauseStart) {
        pauseMsThisShift += t.getTime() - pauseStart.getTime()
        pauseStart = null
      }
    } else if (rec.record_type === 'salida') {
      if (shiftStart) {
        const workedMs = t.getTime() - shiftStart.getTime() - pauseMsThisShift
        const dayKey = shiftStart.toISOString().slice(0, 10)
        byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + Math.max(0, workedMs))
      }
      shiftStart = null
      pauseStart = null
      pauseMsThisShift = 0
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ms]) => {
      const hours = Math.round((ms / 3_600_000) * 100) / 100
      return { date, hours, overtimeHours: Math.max(0, Math.round((hours - STANDARD_DAILY_HOURS) * 100) / 100) }
    })
}

export function currentStatus(lastRecordType: string | null): 'dentro' | 'fuera' | 'en_pausa' {
  if (lastRecordType === 'entrada' || lastRecordType === 'fin_pausa') return 'dentro'
  if (lastRecordType === 'inicio_pausa') return 'en_pausa'
  return 'fuera'
}
