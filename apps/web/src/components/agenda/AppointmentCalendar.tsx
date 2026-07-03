import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, CalendarRange } from 'lucide-react'
import { api } from '@/lib/api'
import { AppointmentModal } from './AppointmentModal'
import { MonthView } from './MonthView'

const START_HOUR = 8
const END_HOUR = 20
const SLOT_MINUTES = 15
const ROW_HEIGHT = 44 // px per 15-min row

interface Slot { hour: number; minute: number; label: string; iso: string }
interface TimeRange { start: string; end: string }

function buildSlots(dateStr: string): Slot[] {
  const slots: Slot[] = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const d = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
      slots.push({ hour: h, minute: m, label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, iso: d.toISOString() })
    }
  }
  return slots
}

function minutesFromWindowStart(iso: string) {
  const d = new Date(iso)
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes()
}

function slotIsOpen(slot: Slot, ranges: TimeRange[]) {
  const mins = slot.hour * 60 + slot.minute
  return ranges.some(r => {
    const [rsh, rsm] = r.start.split(':').map(Number)
    const [reh, rem] = r.end.split(':').map(Number)
    return mins >= rsh * 60 + rsm && mins < reh * 60 + rem
  })
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayStr() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function assignLanes(appts: any[]) {
  const sorted = [...appts].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  const laneEnds: number[] = []
  const withLane = sorted.map(a => {
    const start = new Date(a.start_time).getTime()
    const end = new Date(a.end_time).getTime()
    let lane = laneEnds.findIndex(e => e <= start)
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(end) }
    else laneEnds[lane] = end
    return { ...a, lane }
  })
  const totalLanes = laneEnds.length || 1
  return withLane.map(a => ({ ...a, totalLanes }))
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 border-blue-300 text-blue-800',
  completed: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  cancelled: 'bg-slate-100 border-slate-300 text-slate-400 line-through',
}

export function AppointmentCalendar() {
  const today = todayStr()
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
  const [date, setDate] = useState(today)
  const [monthCursor, setMonthCursor] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 })

  const [appointments, setAppointments] = useState<any[]>([])
  const [monthAppointments, setMonthAppointments] = useState<any[]>([])
  const [dayAvailability, setDayAvailability] = useState<Record<string, { is_open: boolean; time_ranges: TimeRange[] }>>({})
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; initial?: any; defaultStartTime?: string }>({ open: false })

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get(`/appointments?from=${date}&to=${addDays(date, 1)}`)
      setAppointments(Array.isArray(data) ? data : [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [date])

  const loadDayAvailability = useCallback(async () => {
    try {
      const data = await api.get(`/schedule/availability?from=${date}&to=${addDays(date, 1)}`)
      setDayAvailability(data ?? {})
    } catch {
      setDayAvailability({})
    }
  }, [date])

  useEffect(() => {
    if (viewMode === 'day') { loadAppointments(); loadDayAvailability() }
  }, [viewMode, loadAppointments, loadDayAvailability])

  const monthFrom = `${monthCursor.year}-${String(monthCursor.month + 1).padStart(2, '0')}-01`
  const monthTo = addDays(`${monthCursor.year}-${String(monthCursor.month + 1).padStart(2, '0')}-01`, 42) // safely covers the whole visible grid
  const [monthAvailability, setMonthAvailability] = useState<Record<string, { is_open: boolean }>>({})

  const loadMonthData = useCallback(async () => {
    try {
      const [avail, appts] = await Promise.all([
        api.get(`/schedule/availability?from=${monthFrom}&to=${monthTo}`).catch(() => ({})),
        api.get(`/appointments?from=${monthFrom}&to=${monthTo}`).catch(() => []),
      ])
      setMonthAvailability(avail ?? {})
      setMonthAppointments(Array.isArray(appts) ? appts : [])
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFrom, monthTo])

  useEffect(() => {
    if (viewMode === 'month') loadMonthData()
  }, [viewMode, loadMonthData])

  useEffect(() => {
    Promise.all([
      api.get('/patients').catch(() => []),
      api.get('/doctors').catch(() => []),
      api.get('/treatments').catch(() => []),
      api.get('/clinic').catch(() => ({})),
    ]).then(([p, d, t, clinic]) => {
      setPatients(Array.isArray(p) ? p : [])
      setDoctors(Array.isArray(d) ? d : [])
      setTreatments(Array.isArray(t) ? t : [])
      setBranches(Array.isArray((clinic as any)?.branches) ? (clinic as any).branches : [])
    })
  }, [])

  const slots = buildSlots(date)
  const positioned = assignLanes(appointments)
  const todayRanges = dayAvailability[date]?.time_ranges ?? []
  const dayIsOpen = dayAvailability[date]?.is_open

  const appointmentCounts: Record<string, number> = {}
  for (const a of monthAppointments) {
    const key = String(a.start_time).slice(0, 10)
    appointmentCounts[key] = (appointmentCounts[key] ?? 0) + 1
  }

  const goToDay = (dateKey: string) => { setDate(dateKey); setViewMode('day') }
  const navigateMonth = (dir: -1 | 1) => {
    setMonthCursor(c => {
      const m = c.month + dir
      if (m < 0) return { year: c.year - 1, month: 11 }
      if (m > 11) return { year: c.year + 1, month: 0 }
      return { year: c.year, month: m }
    })
  }

  const openCreate = (slot: Slot) => setModal({ open: true, defaultStartTime: slot.iso })
  const openEdit = (a: any) => setModal({
    open: true,
    initial: {
      id: a.id,
      patient_id: a.patient_id,
      doctor_id: a.doctor_id,
      treatment_id: a.treatment_id,
      branch: a.branch,
      start_time: a.start_time,
      notes: a.notes,
    },
  })

  const handleSave = async (data: any) => {
    if (modal.initial?.id) await api.put(`/appointments/${modal.initial.id}`, data)
    else await api.post('/appointments', data)
    await loadAppointments()
  }

  const handleDelete = async () => {
    if (!modal.initial?.id) return
    await api.delete(`/appointments/${modal.initial.id}`)
    await loadAppointments()
  }

  const patientName = (p: any) => p ? (p.full_name ?? p.fullName ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) : '—'

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {viewMode === 'day' ? (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setViewMode('month')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <CalendarRange className="w-4 h-4" />Ver mes
            </button>
            <button onClick={() => setDate(d => addDays(d, -1))} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => setDate(d => addDays(d, 1))} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setDate(today)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
              Hoy
            </button>
          </div>
        ) : (
          <div />
        )}
        <button
          onClick={() => setModal({ open: true, defaultStartTime: slots[0]?.iso })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />Nueva cita
        </button>
      </div>

      {treatments.length === 0 && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Todavía no hay tratamientos creados. Ve a la pestaña "Tratamientos" para crear el primero antes de agendar citas.
        </div>
      )}

      {viewMode === 'month' ? (
        <MonthView
          year={monthCursor.year}
          month={monthCursor.month}
          availability={monthAvailability}
          appointmentCounts={appointmentCounts}
          todayKey={today}
          onNavigate={navigateMonth}
          onSelectDay={goToDay}
        />
      ) : (
        <>
          {dayIsOpen === false && (
            <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600">
              Este día está marcado como cerrado en la Planificación de Agenda. Puedes revisarlo o abrirlo desde esa pestaña.
            </div>
          )}

          {/* Calendar grid */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex">
              {/* Time labels column */}
              <div className="w-16 flex-shrink-0 border-r border-slate-100">
                {slots.map(s => (
                  <div key={s.label} style={{ height: ROW_HEIGHT }} className="text-[11px] text-slate-400 text-right pr-2 pt-1">
                    {s.minute === 0 ? s.label : ''}
                  </div>
                ))}
              </div>

              {/* Slots + appointments */}
              <div className="relative flex-1" style={{ height: slots.length * ROW_HEIGHT }}>
                {slots.map((s, i) => {
                  const open = slotIsOpen(s, todayRanges)
                  return open ? (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => openCreate(s)}
                      className={`absolute left-0 right-0 text-left bg-white hover:bg-blue-50 transition-colors ${s.minute === 0 ? 'border-t border-slate-200' : 'border-t border-slate-50'}`}
                      style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                      aria-label={`Agendar a las ${s.label}`}
                    />
                  ) : (
                    <div
                      key={s.label}
                      className={`absolute left-0 right-0 bg-slate-100 cursor-not-allowed ${s.minute === 0 ? 'border-t border-slate-200' : 'border-t border-slate-100'}`}
                      style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                      title="Fuera del horario disponible"
                    />
                  )
                })}

                {positioned.map(a => {
                  const top = (minutesFromWindowStart(a.start_time) / SLOT_MINUTES) * ROW_HEIGHT
                  const durationMin = (new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 60000
                  const height = Math.max((durationMin / SLOT_MINUTES) * ROW_HEIGHT - 2, ROW_HEIGHT - 4)
                  const widthPct = 100 / a.totalLanes
                  const leftPct = a.lane * widthPct
                  const colorClass = STATUS_COLOR[a.status] ?? STATUS_COLOR.scheduled
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => openEdit(a)}
                      className={`absolute rounded-lg border px-2 py-1 text-left overflow-hidden shadow-sm hover:shadow-md transition-shadow ${colorClass}`}
                      style={{ top: top + 1, height, left: `calc(${leftPct}% + 2px)`, width: `calc(${widthPct}% - 4px)` }}
                    >
                      <p className="text-xs font-semibold truncate">{a.treatment?.name ?? 'Tratamiento'}</p>
                      <p className="text-[11px] truncate">{patientName(a.patient)}</p>
                      {a.doctor?.name && <p className="text-[10px] truncate opacity-75">Dr. {a.doctor.name}</p>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block" />Disponible</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />Fuera de horario</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" />Cita agendada</span>
          </div>
        </>
      )}

      {modal.open && (
        <AppointmentModal
          initial={modal.initial}
          defaultStartTime={modal.defaultStartTime}
          patients={patients}
          doctors={doctors}
          treatments={treatments}
          branches={branches}
          onSave={handleSave}
          onDelete={modal.initial?.id ? handleDelete : undefined}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
