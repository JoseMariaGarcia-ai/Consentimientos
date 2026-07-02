import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Doctor } from '@consentspro/shared-types'

interface DoctorFormProps {
  initial?: Partial<Doctor>
  onSave: (data: Partial<Doctor>) => Promise<void>
  onClose: () => void
}

const ROLES = ['admin', 'doctor', 'receptionist'] as const

const PHONE_PREFIXES = [
  { code: '+34', flag: '🇪🇸' }, { code: '+1',  flag: '🇺🇸' }, { code: '+44', flag: '🇬🇧' },
  { code: '+33', flag: '🇫🇷' }, { code: '+49', flag: '🇩🇪' }, { code: '+39', flag: '🇮🇹' },
  { code: '+351', flag: '🇵🇹' }, { code: '+52', flag: '🇲🇽' }, { code: '+54', flag: '🇦🇷' },
  { code: '+57', flag: '🇨🇴' }, { code: '+56', flag: '🇨🇱' }, { code: '+212', flag: '🇲🇦' },
]

export function DoctorForm({ initial = {}, onSave, onClose }: DoctorFormProps) {
  const { t } = useTranslation()

  const splitName = (full = '') => {
    const parts = full.trim().split(/\s+/)
    return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
  }
  const { firstName: initFirst, lastName: initLast } = splitName(initial.name)

  const splitPhone = (full = '') => {
    const prefix = PHONE_PREFIXES.find(p => full.startsWith(p.code))
    return prefix
      ? { phonePrefix: prefix.code, phoneNumber: full.slice(prefix.code.length).trim() }
      : { phonePrefix: '+34', phoneNumber: full }
  }
  const { phonePrefix: initPrefix, phoneNumber: initNumber } = splitPhone(initial.phone ?? '')

  const [form, setForm] = useState({
    firstName: initFirst.toUpperCase(),
    lastName: initLast.toUpperCase(),
    specialty: (initial.specialty ?? '').toUpperCase(),
    licenseNumber: (initial.licenseNumber ?? (initial as any).license_number ?? '').toUpperCase(),
    email: initial.email ?? '',
    phonePrefix: initPrefix,
    phoneNumber: initNumber.toUpperCase(),
    role: (initial.role ?? 'doctor') as typeof ROLES[number],
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState('')

  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v.toUpperCase() }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = t('common.required')
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    setSaveError('')
    try {
      const { firstName, lastName, phonePrefix, phoneNumber, ...rest } = form
      await onSave({
        ...rest,
        name: [firstName, lastName].filter(Boolean).join(' '),
        phone: `${phonePrefix} ${phoneNumber}`.trim(),
      })
      onClose()
    } catch (err: any) {
      setSaveError(err.message ?? 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form, label: string, opts?: { required?: boolean; type?: string }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {label}{opts?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={opts?.type ?? 'text'}
        value={form[key]}
        onChange={e => up(key, e.target.value)}
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

        <form onSubmit={handleSubmit} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('firstName', 'Nombre', { required: true })}
          {field('lastName', 'Apellidos')}
          {field('specialty', t('doctors.specialty'))}
          {field('licenseNumber', t('doctors.license'))}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Teléfono</label>
            <div className="flex border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <select
                value={form.phonePrefix}
                onChange={e => setForm(f => ({ ...f, phonePrefix: e.target.value }))}
                className="px-2 py-2 bg-slate-50 border-r border-slate-300 text-sm focus:outline-none"
              >
                {PHONE_PREFIXES.map(p => (
                  <option key={p.code} value={p.code}>{p.flag} {p.code}</option>
                ))}
              </select>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value.toUpperCase() }))}
                placeholder="600 000 000"
                className="flex-1 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('doctors.role')}</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof ROLES[number] }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{t(`doctors.roles.${r}`)}</option>
              ))}
            </select>
          </div>

          {saveError && (
            <div className="sm:col-span-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ Error: <strong>{saveError}</strong>
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
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
