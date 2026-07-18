import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Doctor } from '@consentspro/shared-types'
import { useWelcomeMedia } from '@/context/WelcomeMediaContext'
import { PatientCombobox } from '@/components/patients/PatientCombobox'

interface ClinicalRecordFormProps {
  initial?: any
  patients: any[]
  doctors: Doctor[]
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

export function ClinicalRecordForm({ initial = {}, patients, doctors, onSave, onClose }: ClinicalRecordFormProps) {
  const { t } = useTranslation()
  const { trigger: triggerWelcome } = useWelcomeMedia()
  const [form, setForm] = useState({
    patient_id:          initial.patient_id  ?? initial.patientId  ?? '',
    doctor_id:           initial.doctor_id   ?? initial.doctorId   ?? '',
    date:                initial.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    reason_for_visit:    (initial.reason_for_visit    ?? initial.reasonForVisit    ?? '').toUpperCase(),
    anamnesis:           (initial.anamnesis            ?? '').toUpperCase(),
    current_medications: (initial.current_medications ?? initial.currentMedications ?? '').toUpperCase(),
    allergies:           (initial.allergies            ?? '').toUpperCase(),
    physical_exam:       (initial.physical_exam        ?? initial.physicalExam      ?? '').toUpperCase(),
    diagnosis:           (initial.diagnosis            ?? '').toUpperCase(),
    treatment_plan:      (initial.treatment_plan       ?? initial.treatmentPlan     ?? '').toUpperCase(),
    notes:               (initial.notes                ?? '').toUpperCase(),
    is_pregnant:         (initial.is_pregnant ?? null) as boolean | null,
    tobacco_use:         (initial.tobacco_use ?? null) as boolean | null,
    alcohol_use:         (initial.alcohol_use ?? null) as boolean | null,
    drug_use:            (initial.drug_use    ?? null) as boolean | null,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v.toUpperCase() }))
  const setRaw = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setTriState = (k: 'is_pregnant' | 'tobacco_use' | 'alcohol_use' | 'drug_use', v: boolean | null) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patient_id) { setSaveError(t('clinicalRecordForm.select_patient_error')); return }
    setSaving(true)
    setSaveError('')
    try {
      // doctor_id vacío debe ir como undefined, no como "" — un UUID vacío
      // rompe la columna doctor_id en el backend.
      await onSave({ ...form, doctor_id: form.doctor_id || undefined })
      triggerWelcome('clinical')
      onClose()
    } catch (err: any) {
      setSaveError(err.message ?? t('clinicalRecordForm.unknown_error'))
    } finally {
      setSaving(false)
    }
  }

  const triSelect = (key: 'is_pregnant' | 'tobacco_use' | 'alcohol_use' | 'drug_use', label: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</label>
      <select
        value={form[key] === null ? '' : form[key] ? 'yes' : 'no'}
        onChange={e => setTriState(key, e.target.value === '' ? null : e.target.value === 'yes')}
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{t('clinicalRecordForm.tri_state.unspecified')}</option>
        <option value="no">{t('clinicalRecordForm.tri_state.no')}</option>
        <option value="yes">{t('clinicalRecordForm.tri_state.yes')}</option>
      </select>
    </div>
  )

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
            {initial.id ? t('clinicalRecordForm.title_edit') : t('clinicalRecordForm.title_new')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

          {/* Paciente + Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('clinicalRecordForm.patient')} <span className="text-red-500">*</span></label>
              <PatientCombobox
                patients={patients}
                value={form.patient_id}
                onChange={id => setRaw('patient_id', id)}
                placeholder={t('clinicalRecordForm.select_patient')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('clinicalRecordForm.doctor')}</label>
              <select
                value={form.doctor_id}
                onChange={e => setRaw('doctor_id', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('clinicalRecordForm.unassigned')}</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('clinicalRecordForm.visit_date')}</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setRaw('date', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('clinicalRecordForm.reason_for_visit')}</label>
              <input
                type="text"
                value={form.reason_for_visit}
                onChange={e => set('reason_for_visit', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Embarazo y hábitos */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('clinicalRecordForm.habits_title')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {triSelect('is_pregnant', t('clinicalRecordForm.is_pregnant'))}
              {triSelect('tobacco_use', t('clinicalRecordForm.tobacco_use'))}
              {triSelect('alcohol_use', t('clinicalRecordForm.alcohol_use'))}
              {triSelect('drug_use', t('clinicalRecordForm.drug_use'))}
            </div>
          </div>

          {/* Secciones clínicas */}
          {textarea('anamnesis', t('clinicalRecordForm.anamnesis'), 3)}
          {textarea('current_medications', t('clinicalRecordForm.current_medications'), 2)}
          {textarea('allergies', t('clinicalRecordForm.allergies'), 2)}
          {textarea('physical_exam', t('clinicalRecordForm.physical_exam'), 3)}
          {textarea('diagnosis', t('clinicalRecordForm.diagnosis'), 2)}
          {textarea('treatment_plan', t('clinicalRecordForm.treatment_plan'), 3)}
          {textarea('notes', t('clinicalRecordForm.notes'), 2)}

          {saveError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ {saveError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
              {t('clinicalRecordForm.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? t('clinicalRecordForm.saving') : t('clinicalRecordForm.save_record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
