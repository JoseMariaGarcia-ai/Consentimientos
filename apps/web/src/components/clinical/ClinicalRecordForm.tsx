import { useState } from 'react'
import type { Doctor } from '@consentspro/shared-types'
import { useWelcomeMedia } from '@/context/WelcomeMediaContext'

interface ClinicalRecordFormProps {
  initial?: any
  patients: any[]
  doctors: Doctor[]
  branches?: { id: string; name: string }[]
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

export function ClinicalRecordForm({ initial = {}, patients, doctors, branches = [], onSave, onClose }: ClinicalRecordFormProps) {
  const { trigger: triggerWelcome } = useWelcomeMedia()
  const [form, setForm] = useState({
    patient_id:          initial.patient_id  ?? initial.patientId  ?? '',
    doctor_id:           initial.doctor_id   ?? initial.doctorId   ?? '',
    branch:              initial.branch ?? '',
    date:                initial.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    reason_for_visit:    (initial.reason_for_visit    ?? initial.reasonForVisit    ?? '').toUpperCase(),
    anamnesis:           (initial.anamnesis            ?? '').toUpperCase(),
    current_medications: (initial.current_medications ?? initial.currentMedications ?? '').toUpperCase(),
    allergies:           (initial.allergies            ?? '').toUpperCase(),
    physical_exam:       (initial.physical_exam        ?? initial.physicalExam      ?? '').toUpperCase(),
    diagnosis:           (initial.diagnosis            ?? '').toUpperCase(),
    treatment_plan:      (initial.treatment_plan       ?? initial.treatmentPlan     ?? '').toUpperCase(),
    notes:               (initial.notes                ?? '').toUpperCase(),
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v.toUpperCase() }))
  const setRaw = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patient_id) { setSaveError('Selecciona un paciente'); return }
    setSaving(true)
    setSaveError('')
    try {
      await onSave(form)
      triggerWelcome('clinical')
      onClose()
    } catch (err: any) {
      setSaveError(err.message ?? 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const textarea = (key: string, label: string, rows = 2) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</label>
      <textarea
        value={(form as any)[key]}
        onChange={e => set(key, e.target.value)}
        rows={rows}
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {initial.id ? 'Editar historia clínica' : 'Nueva historia clínica'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

          {/* Paciente + Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Paciente <span className="text-red-500">*</span></label>
              <select
                value={form.patient_id}
                onChange={e => setRaw('patient_id', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar paciente…</option>
                {patients.map((p: any) => {
                  const name = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : (p.fullName ?? p.full_name ?? '')
                  return <option key={p.id} value={p.id}>{name}</option>
                })}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Doctor</label>
              <select
                value={form.doctor_id}
                onChange={e => setRaw('doctor_id', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {/* Clínica (sede) — solo si hay más de una */}
          {branches.length > 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Clínica / Sede</label>
              <select
                value={form.branch}
                onChange={e => setRaw('branch', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin especificar</option>
                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Fecha de visita</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setRaw('date', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Motivo de consulta</label>
              <input
                type="text"
                value={form.reason_for_visit}
                onChange={e => set('reason_for_visit', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Secciones clínicas */}
          {textarea('anamnesis', 'Anamnesis / Antecedentes', 3)}
          {textarea('current_medications', 'Medicación actual', 2)}
          {textarea('allergies', 'Alergias conocidas', 2)}
          {textarea('physical_exam', 'Exploración física', 3)}
          {textarea('diagnosis', 'Diagnóstico', 2)}
          {textarea('treatment_plan', 'Plan de tratamiento', 3)}
          {textarea('notes', 'Observaciones / Notas', 2)}

          {saveError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ {saveError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Guardando…' : 'Guardar historia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
