import { useState } from 'react'
import { CalendarClock, X } from 'lucide-react'

interface Treatment {
  id: string
  name: string
  duration_minutes: number
  price: number
}

interface Props {
  initial?: {
    id?: string
    patient_id?: string
    doctor_id?: string
    treatment_id?: string
    branch?: string
    start_time?: string
    notes?: string
  }
  defaultStartTime?: string
  patients: any[]
  doctors: any[]
  treatments: Treatment[]
  branches?: { id: string; name: string }[]
  onSave: (data: any) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

function toLocalInputValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function AppointmentModal({ initial, defaultStartTime, patients, doctors, treatments, branches = [], onSave, onDelete, onClose }: Props) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    patient_id: initial?.patient_id ?? '',
    doctor_id: initial?.doctor_id ?? '',
    treatment_id: initial?.treatment_id ?? '',
    branch: initial?.branch ?? '',
    start_time: toLocalInputValue(initial?.start_time ?? defaultStartTime),
    notes: initial?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))
  const selectedTreatment = treatments.find(t => t.id === form.treatment_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patient_id || !form.treatment_id || !form.start_time) {
      setError('Paciente, tratamiento y hora son obligatorios')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        ...form,
        doctor_id: form.doctor_id || undefined,
        branch: form.branch || undefined,
        start_time: new Date(form.start_time).toISOString(),
      })
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm('¿Eliminar esta cita?')) return
    setDeleting(true)
    try {
      await onDelete()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">{isEdit ? 'Editar cita' : 'Nueva cita'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Paciente */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Paciente <span className="text-red-500">*</span></label>
            <select
              value={form.patient_id}
              onChange={e => set('patient_id', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar paciente…</option>
              {patients.map(p => {
                const name = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : (p.fullName ?? p.full_name ?? '')
                return <option key={p.id} value={p.id}>{name}</option>
              })}
            </select>
          </div>

          {/* Doctor */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Doctor</label>
            <select
              value={form.doctor_id}
              onChange={e => set('doctor_id', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin asignar</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Clínica / Sede */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Clínica / Sede</label>
            <select
              value={form.branch}
              onChange={e => set('branch', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sede principal</option>
              {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>

          {/* Tratamiento */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Tratamiento <span className="text-red-500">*</span></label>
            <select
              value={form.treatment_id}
              onChange={e => set('treatment_id', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar tratamiento…</option>
              {treatments.map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.duration_minutes} min — {Number(t.price).toFixed(2)} €</option>
              ))}
            </select>
            {treatments.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No hay tratamientos creados. Añade uno en la pestaña "Tratamientos" primero.</p>
            )}
          </div>

          {/* Hora de inicio */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Fecha y hora <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              step={900}
              value={form.start_time}
              onChange={e => set('start_time', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedTreatment && (
              <p className="text-xs text-slate-400 mt-1">Ocupará {selectedTreatment.duration_minutes} minutos en la agenda.</p>
            )}
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Observaciones sobre la cita…"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {error}</div>
          )}

          <div className="flex justify-between items-center gap-3 pt-2 border-t border-slate-100">
            {isEdit && onDelete ? (
              <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                {deleting ? 'Eliminando…' : 'Eliminar cita'}
              </button>
            ) : <span />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cita'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
