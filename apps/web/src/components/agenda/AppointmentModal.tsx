import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

function todayDateKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AppointmentModal({ initial, defaultStartTime, patients, doctors, treatments, branches = [], onSave, onDelete, onClose }: Props) {
  const { t } = useTranslation()
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

  const originalStartTime = initial?.start_time ? toLocalInputValue(initial.start_time) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patient_id || !form.treatment_id || !form.start_time) {
      setError(t('appointmentModal.validation_required'))
      return
    }
    // Solo se bloquea si de verdad se está moviendo la cita a una fecha
    // pasada — editar otros campos de una cita que ya ocurrió (notas,
    // estado) sin tocar la fecha no debe impedirse por esto.
    const timeChanged = form.start_time !== originalStartTime
    if (timeChanged && form.start_time.slice(0, 10) < todayDateKey()) {
      setError(t('appointmentModal.validation_past_date'))
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
      setError(err.message ?? t('appointmentModal.error_unknown'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm(t('appointmentModal.confirm_delete'))) return
    setDeleting(true)
    try {
      await onDelete()
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('appointmentModal.error_unknown'))
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">{isEdit ? t('appointmentModal.title_edit') : t('appointmentModal.title_new')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Paciente */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('appointmentModal.form.patient')} <span className="text-red-500">*</span></label>
            <select
              value={form.patient_id}
              onChange={e => set('patient_id', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('appointmentModal.form.select_patient')}</option>
              {patients.map(p => {
                const name = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : (p.fullName ?? p.full_name ?? '')
                return <option key={p.id} value={p.id}>{name}</option>
              })}
            </select>
          </div>

          {/* Doctor */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('appointmentModal.form.doctor')}</label>
            <select
              value={form.doctor_id}
              onChange={e => set('doctor_id', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('appointmentModal.form.unassigned')}</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Clínica / Sede */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('appointmentModal.form.branch')}</label>
            <select
              value={form.branch}
              onChange={e => set('branch', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('appointmentModal.form.main_branch')}</option>
              {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>

          {/* Tratamiento */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('appointmentModal.form.treatment')} <span className="text-red-500">*</span></label>
            <select
              value={form.treatment_id}
              onChange={e => set('treatment_id', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('appointmentModal.form.select_treatment')}</option>
              {treatments.map(tr => (
                <option key={tr.id} value={tr.id}>{t('appointmentModal.form.treatment_option', { name: tr.name, duration: tr.duration_minutes, price: Number(tr.price).toFixed(2) })}</option>
              ))}
            </select>
            {treatments.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">{t('appointmentModal.form.no_treatments_warning')}</p>
            )}
          </div>

          {/* Hora de inicio */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('appointmentModal.form.datetime')} <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              step={900}
              value={form.start_time}
              onChange={e => set('start_time', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedTreatment && (
              <p className="text-xs text-slate-400 mt-1">{t('appointmentModal.form.duration_note', { duration: selectedTreatment.duration_minutes })}</p>
            )}
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('appointmentModal.form.notes')}</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder={t('appointmentModal.form.notes_placeholder')}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {error}</div>
          )}

          <div className="flex justify-between items-center gap-3 pt-2 border-t border-slate-100">
            {isEdit && onDelete ? (
              <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                {deleting ? t('appointmentModal.deleting') : t('appointmentModal.delete_appointment')}
              </button>
            ) : <span />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                {t('appointmentModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? t('appointmentModal.saving') : isEdit ? t('appointmentModal.save_changes') : t('appointmentModal.create_appointment')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
