import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Patient } from '@consentspro/shared-types'
import { PROVINCIAS_ES } from '@/constants/provinces'

interface PatientFormProps {
  initial?: Partial<Patient>
  onSave: (data: Partial<Patient>) => Promise<void>
  onClose: () => void
}

const DOC_TYPES = ['DNI', 'NIE', 'Pasaporte', 'Other']

// Canonical values persisted to the data model — keep stable across locales.
// Display labels are looked up via i18n (patients.form.countries) in the component.
const COUNTRIES = [
  'España', 'Alemania', 'Argentina', 'Bélgica', 'Bolivia', 'Brasil', 'Chile', 'China',
  'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'EE.UU.', 'Francia',
  'Guatemala', 'Honduras', 'Italia', 'Marruecos', 'México', 'Nicaragua', 'Países Bajos',
  'Panamá', 'Paraguay', 'Perú', 'Portugal', 'Reino Unido', 'República Dominicana',
  'Suiza', 'Uruguay', 'Venezuela', 'Otro',
]

const PHONE_PREFIXES = [
  { code: '+34', flag: '🇪🇸', label: 'España' },
  { code: '+1',  flag: '🇺🇸', label: 'EE.UU.' },
  { code: '+44', flag: '🇬🇧', label: 'Reino Unido' },
  { code: '+33', flag: '🇫🇷', label: 'Francia' },
  { code: '+49', flag: '🇩🇪', label: 'Alemania' },
  { code: '+39', flag: '🇮🇹', label: 'Italia' },
  { code: '+351', flag: '🇵🇹', label: 'Portugal' },
  { code: '+52', flag: '🇲🇽', label: 'México' },
  { code: '+54', flag: '🇦🇷', label: 'Argentina' },
  { code: '+57', flag: '🇨🇴', label: 'Colombia' },
  { code: '+56', flag: '🇨🇱', label: 'Chile' },
  { code: '+58', flag: '🇻🇪', label: 'Venezuela' },
  { code: '+51', flag: '🇵🇪', label: 'Perú' },
  { code: '+593', flag: '🇪🇨', label: 'Ecuador' },
  { code: '+32', flag: '🇧🇪', label: 'Bélgica' },
  { code: '+31', flag: '🇳🇱', label: 'Países Bajos' },
  { code: '+41', flag: '🇨🇭', label: 'Suiza' },
  { code: '+212', flag: '🇲🇦', label: 'Marruecos' },
  { code: '+971', flag: '🇦🇪', label: 'EAU' },
  { code: '+86', flag: '🇨🇳', label: 'China' },
]

export function PatientForm({ initial = {}, onSave, onClose }: PatientFormProps) {
  const { t } = useTranslation()
  const countryLabels = t('patients.form.countries', { returnObjects: true }) as string[]
  const provinceLabels = t('patients.form.provinces', { returnObjects: true }) as string[]
  const docTypeLabel = (d: string) => d === 'Pasaporte' ? t('patients.form.doc_type_passport') : d
  const initFirst = ((initial as any).firstName ?? (initial as any).first_name ?? '').toString()
  const initLast  = ((initial as any).lastName  ?? (initial as any).last_name  ?? '').toString()

  const splitAddress = (full = '') => {
    const parts = full.split('|')
    return {
      addrStreet: parts[0] ?? '',
      addrCity: parts[1] ?? '',
      addrProvince: parts[2] ?? '',
      addrCountry: parts[3] ?? 'España',
    }
  }
  const { addrStreet: initStreet, addrCity: initCity, addrProvince: initProvince, addrCountry: initCountry } = splitAddress(initial.address)

  const splitPhone = (full = '') => {
    const prefix = PHONE_PREFIXES.find(p => full.startsWith(p.code))
    return prefix
      ? { phonePrefix: prefix.code, phoneNumber: full.slice(prefix.code.length).trim() }
      : { phonePrefix: '+34', phoneNumber: full }
  }
  const { phonePrefix: initPrefix, phoneNumber: initNumber } = splitPhone(initial.phone)

  const [form, setForm] = useState({
    firstName: initFirst,
    lastName: initLast,
    dateOfBirth: initial.dateOfBirth ?? '',
    idDocument: initial.idDocument ?? '',
    idDocType: initial.idDocType ?? 'DNI',
    phonePrefix: initPrefix,
    phoneNumber: initNumber,
    email: initial.email ?? '',
    addrStreet: initStreet,
    addrCity: initCity,
    addrProvince: initProvince,
    addrCountry: initCountry,
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v.toUpperCase() }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = t('common.required')
    if (!form.phoneNumber.trim()) e.phoneNumber = t('common.required')
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    setSaveError('')
    try {
      const { firstName, lastName, phonePrefix, phoneNumber, addrStreet, addrCity, addrProvince, addrCountry, ...rest } = form
      await onSave({
        ...rest,
        firstName,
        lastName,
        fullName: [firstName, lastName].filter(Boolean).join(' '),
        phone: `${phonePrefix} ${phoneNumber}`.trim(),
        address: [addrStreet, addrCity, addrProvince, addrCountry].join('|'),
      } as any)
      onClose()
    } catch (err: any) {
      setSaveError(err.message ?? t('patients.form.unknown_error'))
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

        <form onSubmit={handleSubmit} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('firstName', t('patients.name'), { required: true })}
          {field('lastName', t('patients.surname'))}
          {field('dateOfBirth', t('patients.dob'), { type: 'date' })}

          <div className="flex gap-2">
            <div className="flex flex-col gap-1 w-28 flex-shrink-0">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('patients.form.doc_type')}</label>
              <select
                value={form.idDocType}
                onChange={e => set('idDocType', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DOC_TYPES.map(d => <option key={d} value={d}>{docTypeLabel(d)}</option>)}
              </select>
            </div>
            <div className="flex-1">{field('idDocument', t('patients.id_doc'))}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              {t('patients.phone')}<span className="text-red-500 ml-1">*</span>
            </label>
            <div className={`flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${errors.phoneNumber ? 'border-red-400' : 'border-slate-300'}`}>
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
            {errors.phoneNumber && <span className="text-xs text-red-500">{errors.phoneNumber}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('patients.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!form.email.trim() && (
              <span className="text-xs text-amber-600">{t('patients.form.no_email_warning')}</span>
            )}
          </div>
          <div className="sm:col-span-2">{field('addrStreet', t('patients.address'))}</div>
          {field('addrCity', t('patients.form.city'))}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('patients.form.province')}</label>
            <select
              value={form.addrProvince}
              onChange={e => setForm(f => ({ ...f, addrProvince: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('patients.form.select_placeholder')}</option>
              {PROVINCIAS_ES.map((p, i) => <option key={p} value={p}>{provinceLabels[i] ?? p}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('patients.form.country')}</label>
            <select
              value={form.addrCountry}
              onChange={e => setForm(f => ({ ...f, addrCountry: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COUNTRIES.map((c, i) => <option key={c} value={c}>{countryLabels[i] ?? c}</option>)}
            </select>
          </div>

          {saveError && (
            <div className="sm:col-span-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ {t('patients.form.save_error_prefix')} <strong>{saveError}</strong>
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
              {saving ? t('common.loading') : t('patients.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
