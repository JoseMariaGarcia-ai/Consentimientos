import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Building2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { Clinic } from '@consentspro/shared-types'

export default function ClinicPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<Clinic>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/clinic').then(data => { if (data) setForm(data) }).finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/clinic', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof Clinic, label: string, opts?: { type?: string }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      <input
        type={opts?.type ?? 'text'}
        value={(form[key] as string) ?? ''}
        onChange={e => set(key, e.target.value)}
        className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  if (loading) return <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('clinic.title')}</h1>
          <p className="text-sm text-slate-500">Configuración general de la clínica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        {field('name', t('clinic.name'))}
        {field('address', t('clinic.address'))}
        <div className="grid grid-cols-2 gap-4">
          {field('phone', t('clinic.phone'), { type: 'tel' })}
          {field('email', t('clinic.email'), { type: 'email' })}
        </div>
        {field('taxId', t('clinic.tax_id'))}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {saved && <span className="text-sm text-emerald-600 font-medium">✓ Guardado correctamente</span>}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? t('common.loading') : t('clinic.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
