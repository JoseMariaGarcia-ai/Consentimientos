import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { AppointmentModal } from './AppointmentModal'

const START_HOUR = 8
const END_HOUR = 20
const SLOT_MINUTES = 15
const ROW_HEIGHT = 44 // px per 15-min row

interface Slot { hour: number; minute: number; label: string; iso: string }

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
  const [date, setDate] = useState(todayStr())
  const [appointments, setAppointments] = useState<any[]>([])
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

  useEffect(() => { loadAppointments() }, [loadAppointments])

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
        <div className="flex items-center gap-2">
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
          <button onClick={() => setDate(todayStr())} className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
            Hoy
          </button>
        </div>
        <button
          onClick={() => setModal({ open: true, defaultStartTime: slots[0]?.iso })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />Nueva cita
        </button>
      </div>

      {treatments.length === 0 && !loading && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Todavía no hay tratamientos creados. Ve a la pestaña "Tratamientos" para crear el primero antes de agendar citas.
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
            {slots.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => openCreate(s)}
                className={`absolute left-0 right-0 text-left hover:bg-blue-50/60 transition-colors ${s.minute === 0 ? 'border-t border-slate-200' : 'border-t border-slate-50'}`}
                style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                aria-label={`Agendar a las ${s.label}`}
              />
            ))}

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
