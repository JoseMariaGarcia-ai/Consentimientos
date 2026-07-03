import { queryOne } from './db'

export interface TimeRange { start: string; end: string }

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Open ranges for one specific date: an exception (if any) always wins over the weekly pattern.
export async function getOpenRangesForDate(clinicId: string, dateStr: string, weekday: number): Promise<TimeRange[]> {
  const exception = await queryOne<any>('SELECT is_open, time_ranges FROM schedule_exceptions WHERE clinic_id=$1 AND date=$2', [clinicId, dateStr])
  if (exception) return exception.is_open ? (exception.time_ranges ?? []) : []
  const pattern = await queryOne<any>('SELECT is_open, time_ranges FROM schedule_patterns WHERE clinic_id=$1 AND weekday=$2', [clinicId, weekday])
  return pattern?.is_open ? (pattern.time_ranges ?? []) : []
}

// Whether [startISO, endISO) fits entirely inside a single open range for that day.
export async function isSlotAvailable(clinicId: string, startISO: string, endISO: string): Promise<boolean> {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const ranges = await getOpenRangesForDate(clinicId, localDateKey(start), start.getDay())
  if (ranges.length === 0) return false
  const startMin = start.getHours() * 60 + start.getMinutes()
  const endMin = end.getHours() * 60 + end.getMinutes()
  return ranges.some(r => {
    const [rsh, rsm] = r.start.split(':').map(Number)
    const [reh, rem] = r.end.split(':').map(Number)
    return startMin >= rsh * 60 + rsm && endMin <= reh * 60 + rem
  })
}
