import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, CalendarRange, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { AppointmentModal } from './AppointmentModal'
import { MonthView } from './MonthView'
import { treatmentColorStyle } from '@/lib/treatmentColors'

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

// Local-component date-string helpers. Deliberately avoid toISOString() here:
// it converts to UTC, which silently shifts the calendar date backward for
// any timezone ahead of UTC (e.g. Europe/Madrid) — that bug made "add a day"
// sometimes return the same day, breaking day navigation and the from/to
// range sent to /appointments and /schedule/availability.
function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

function todayStr() {
  return toDateKey(new Date())
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

const STATUS_CLASS: Record<string, string> = {
  scheduled: '',
  completed: '',
  cancelled: 'opacity-50 line-through grayscale',
}

// Umbral en px antes de considerar el gesto un arrastre en vez de un toque
// simple — evita que un pequeño temblor del dedo/ratón al pulsar abra el
// modal de edición en lugar de mover la cita, y viceversa.
const DRAG_THRESHOLD_PX = 6

interface DraggableAppointmentBlockProps {
  appt: any
  top: number
  height: number
  leftPct: number
  widthPct: number
  patientName: string
  onOpen: () => void
  onMove: (deltaMinutes: number) => void
}

function DraggableAppointmentBlock({ appt: a, top, height, leftPct, widthPct, patientName, onOpen, onMove }: DraggableAppointmentBlockProps) {
  const { t } = useTranslation()
  const statusClass = STATUS_CLASS[a.status] ?? STATUS_CLASS.scheduled
  const colorStyle = treatmentColorStyle(a.treatment?.color)
  const dragRef = useRef<{ startY: number; deltaSlots: number; dragging: boolean } | null>(null)
  const [dragOffsetPx, setDragOffsetPx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startY: e.clientY, deltaSlots: 0, dragging: false }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const deltaY = e.clientY - drag.startY
    if (!drag.dragging && Math.abs(deltaY) < DRAG_THRESHOLD_PX) return
    drag.dragging = true
    const deltaSlots = Math.round(deltaY / ROW_HEIGHT)
    drag.deltaSlots = deltaSlots
    setDragOffsetPx(deltaSlots * ROW_HEIGHT)
    setIsDragging(true)
  }

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    dragRef.current = null
    setIsDragging(false)
    setDragOffsetPx(0)
    if (drag?.dragging) {
      if (drag.deltaSlots !== 0) onMove(drag.deltaSlots * SLOT_MINUTES)
    } else if (e.type === 'pointerup') {
      onOpen()
    }
  }

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute rounded-lg border px-2 py-1 text-left overflow-hidden shadow-sm transition-shadow ${isDragging ? 'shadow-lg cursor-grabbing' : 'hover:shadow-md cursor-grab'} ${statusClass}`}
      style={{
        top: top + 1 + dragOffsetPx,
        height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        touchAction: 'none',
        zIndex: isDragging ? 20 : undefined,
        ...colorStyle,
      }}
      title={t('appointmentCalendar.drag_hint')}
    >
      <p className="text-xs font-semibold truncate flex items-center gap-1">
        {a.status === 'completed' && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
        {a.treatment?.name ?? t('appointmentCalendar.treatment_fallback')}
        {a.treatment?.price != null && <span className="font-normal"> · {Number(a.treatment.price).toFixed(2)} €</span>}
      </p>
      <p className="text-[11px] truncate">{patientName}</p>
      {a.doctor?.name && <p className="text-[10px] truncate opacity-75">{t('appointmentCalendar.doctor_prefix', { name: a.doctor.name })}</p>}
    </button>
  )
}

export function AppointmentCalendar() {
  const { t } = useTranslation()
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
    ]).then(([p, d, t]) => {
      setPatients(Array.isArray(p) ? p : [])
      setDoctors(Array.isArray(d) ? d : [])
      setTreatments(Array.isArray(t) ? t : [])
    })
  }, [])

  const slots = buildSlots(date)
  const positioned = assignLanes(appointments)
  const todayRanges = dayAvailability[date]?.time_ranges ?? []
  const dayIsOpen = dayAvailability[date]?.is_open

  const appointmentCounts: Record<string, number> = {}
  for (const a of monthAppointments) {
    const key = toDateKey(new Date(a.start_time))
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
      start_time: a.start_time,
      notes: a.notes,
    },
  })

  const handleSave = async (data: any) => {
    if (modal.initial?.id) await api.put(`/appointments/${modal.initial.id}`, data)
    else await api.post('/appointments', data)
    await Promise.all([loadAppointments(), loadMonthData()])
  }

  const handleDelete = async () => {
    if (!modal.initial?.id) return
    await api.delete(`/appointments/${modal.initial.id}`)
    await Promise.all([loadAppointments(), loadMonthData()])
  }

  // Arrastrar y soltar una cita en la vista diaria — se reenvían todos los
  // campos existentes (el PUT no admite actualización parcial) cambiando
  // solo la hora de inicio según los minutos desplazados.
  const handleMoveAppointment = async (a: any, deltaMinutes: number) => {
    if (deltaMinutes === 0) return
    const newStart = new Date(new Date(a.start_time).getTime() + deltaMinutes * 60000)
    try {
      await api.put(`/appointments/${a.id}`, {
        patient_id: a.patient_id,
        doctor_id: a.doctor_id,
        treatment_id: a.treatment_id,
        start_time: newStart.toISOString(),
        notes: a.notes,
        status: a.status,
      })
      await Promise.all([loadAppointments(), loadMonthData()])
    } catch (err: any) {
      alert(err.message ?? t('appointmentCalendar.drag_error'))
    }
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
              <CalendarRange className="w-4 h-4" />{t('appointmentCalendar.view_month')}
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
              {t('appointmentCalendar.today')}
            </button>
          </div>
        ) : (
          <div />
        )}
        <button
          onClick={() => setModal({ open: true, defaultStartTime: slots[0]?.iso })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />{t('appointmentCalendar.new_appointment')}
        </button>
      </div>

      {treatments.length === 0 && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          {t('appointmentCalendar.no_treatments_warning')}
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
              {t('appointmentCalendar.day_closed_notice')}
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
                      aria-label={t('appointmentCalendar.slot_aria_label', { time: s.label })}
                    />
                  ) : (
                    <div
                      key={s.label}
                      className={`absolute left-0 right-0 bg-slate-100 cursor-not-allowed ${s.minute === 0 ? 'border-t border-slate-200' : 'border-t border-slate-100'}`}
                      style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                      title={t('appointmentCalendar.outside_availability')}
                    />
                  )
                })}

                {positioned.map(a => {
                  const top = (minutesFromWindowStart(a.start_time) / SLOT_MINUTES) * ROW_HEIGHT
                  const durationMin = (new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 60000
                  const height = Math.max((durationMin / SLOT_MINUTES) * ROW_HEIGHT - 2, ROW_HEIGHT - 4)
                  const widthPct = 100 / a.totalLanes
                  const leftPct = a.lane * widthPct
                  return (
                    <DraggableAppointmentBlock
                      key={a.id}
                      appt={a}
                      top={top}
                      height={height}
                      leftPct={leftPct}
                      widthPct={widthPct}
                      patientName={patientName(a.patient)}
                      onOpen={() => openEdit(a)}
                      onMove={deltaMinutes => handleMoveAppointment(a, deltaMinutes)}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block" />{t('appointmentCalendar.legend.available')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />{t('appointmentCalendar.legend.outside_hours')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" />{t('appointmentCalendar.legend.scheduled')}</span>
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
          onSave={handleSave}
          onDelete={modal.initial?.id ? handleDelete : undefined}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
