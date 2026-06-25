import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Doctor } from '@consentspro/shared-types'

interface DoctorFormProps {
  initial?: Partial<Doctor>
  onSave: (data: Partial<Doctor>) => Promise<void>
  onClose: () => void
}

const ROLES = ['admin', 'doctor', 'receptionist'] as const

export function DoctorForm({ initial = {}, onSave, onClose }: DoctorFormProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: initial.name ?? '',
    specialty: initial.specialty ?? '',
    licenseNumber: initial.licenseNumber ?? '',
    email: initial.email ?? '',
    role: (initial.role ?? 'doctor') as typeof ROLES[number],
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = t('common.required')
    if (!form.email.trim()) e.email = t('common.required')
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try { await onSave(form); onClose() }
    finally { setSaving(false) }
  }

  const field = (key: keyof typeof form, label: string, opts?: { required?: boolean; type?: string }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {label}{opts?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={opts?.type ?? 'text'}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[key] ? 'border-red-400' : 'border-slate-300'}`}
      />
      {errors[key] && <span className="text-xs text-red-500">{errors[key]}</span>}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {initial.id ? t('common.edit') : t('doctors.add')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {field('name', t('doctors.name'), { required: true })}
          {field('specialty', t('doctors.specialty'))}
          {field('licenseNumber', t('doctors.license'))}
          {field('email', t('doctors.email'), { type: 'email', required: true })}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('doctors.role')}</label>
            <select
              value={form.role}
              onChange={e => set('role', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{t(`doctors.roles.${r}`)}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? t('common.loading') : t('doctors.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
