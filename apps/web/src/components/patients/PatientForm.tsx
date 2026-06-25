import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Patient } from '@consentspro/shared-types'

interface PatientFormProps {
  initial?: Partial<Patient>
  onSave: (data: Partial<Patient>) => Promise<void>
  onClose: () => void
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const DOC_TYPES = ['DNI', 'NIE', 'Pasaporte', 'Other']

export function PatientForm({ initial = {}, onSave, onClose }: PatientFormProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    fullName: initial.fullName ?? '',
    dateOfBirth: initial.dateOfBirth ?? '',
    idDocument: initial.idDocument ?? '',
    idDocType: initial.idDocType ?? 'DNI',
    phone: initial.phone ?? '',
    email: initial.email ?? '',
    address: initial.address ?? '',
    allergies: initial.allergies ?? '',
    medications: initial.medications ?? '',
    bloodType: initial.bloodType ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = t('common.required')
    if (!form.phone.trim()) e.phone = t('common.required')
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form, label: string, opts?: { type?: string; required?: boolean }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {label}{opts?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={opts?.type ?? 'text'}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors[key] ? 'border-red-400' : 'border-slate-300'
        }`}
      />
      {errors[key] && <span className="text-xs text-red-500">{errors[key]}</span>}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {initial.id ? t('common.edit') : t('patients.add')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            {field('fullName', t('patients.name'), { required: true })}
          </div>
          {field('dateOfBirth', t('patients.dob'), { type: 'date' })}

          <div className="flex gap-2">
            <div className="flex flex-col gap-1 w-28 flex-shrink-0">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Tipo</label>
              <select
                value={form.idDocType}
                onChange={e => set('idDocType', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DOC_TYPES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex-1">{field('idDocument', t('patients.id_doc'))}</div>
          </div>

          {field('phone', t('patients.phone'), { type: 'tel', required: true })}
          {field('email', t('patients.email'), { type: 'email' })}
          <div className="col-span-2">{field('address', t('patients.address'))}</div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('patients.blood_type')}</label>
            <select
              value={form.bloodType}
              onChange={e => set('bloodType', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">—</option>
              {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            {field('allergies', t('patients.allergies'))}
          </div>

          <div className="col-span-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('patients.medications')}</label>
              <textarea
                value={form.medications}
                onChange={e => set('medications', e.target.value)}
                rows={2}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? t('common.loading') : t('patients.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
