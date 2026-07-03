import { queryOne } from './db'

export interface TimeRange { start: string; end: string }

// Business hours are configured by clinics in clinic-local wall-clock time
// (Europe/Madrid). The server process itself may run in any timezone (Railway
// containers default to UTC), so date/hour extraction from a UTC instant must
// go through Intl with an explicit timeZone — never Date's own getFullYear()/
// getHours()/getDay(), which reflect the server's local timezone, not Madrid's.
const CLINIC_TZ = 'Europe/Madrid'
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

function madridParts(d: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
    weekday: 'short',
  }).formatToParts(d)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  return {
    dateKey: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(map.hour) * 60 + Number(map.minute),
    weekday: WEEKDAY_INDEX[map.weekday],
  }
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
  const start = madridParts(new Date(startISO))
  const end = madridParts(new Date(endISO))
  const ranges = await getOpenRangesForDate(clinicId, start.dateKey, start.weekday)
  if (ranges.length === 0) return false
  return ranges.some(r => {
    const [rsh, rsm] = r.start.split(':').map(Number)
    const [reh, rem] = r.end.split(':').map(Number)
    return start.minutes >= rsh * 60 + rsm && end.minutes <= reh * 60 + rem
  })
}
