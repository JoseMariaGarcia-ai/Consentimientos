import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Building2, Image as ImageIcon, X, Loader2, Stethoscope } from 'lucide-react'
import { api } from '@/lib/api'
import { compressImage, blobToBase64 } from '@/lib/imageCompression'
import { useAuth } from '@/lib/auth'
import { DoctorPermissionsPanel } from '@/components/clinic/DoctorPermissionsPanel'
import type { Clinic } from '@consentspro/shared-types'
import { PROVINCIAS_ES } from '@/constants/provinces'

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export default function ClinicPage() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const canManageDoctors = role === 'clinica' || role === 'superadmin'
  const [tab, setTab] = useState<'info' | 'doctors'>('info')
  const [form, setForm] = useState<Partial<Clinic>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const provinceLabels = t('patients.form.provinces', { returnObjects: true }) as string[]

  useEffect(() => {
    api.get('/clinic').then(data => {
      if (data) {
        setForm(data)
        setLogoPreviewUrl(data.logo_url ?? '')
      }
    }).finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: (k === 'email' || k === 'directions_url') ? v : v.toUpperCase() }))

  // Mismo patrón que la foto de doctor: se comprime siempre a un tamaño
  // razonable en el navegador antes de subir (un logo no necesita más
  // resolución que esta para verse bien en el portal del paciente o en
  // impresión), así nunca se acerca al límite de tamaño del servidor.
  const LOGO_MAX_DIMENSION = 1000
  const LOGO_MAX_BYTES = 15 * 1024 * 1024

  const handleLogoSelect = async (file?: File) => {
    if (!file) return
    setLogoError('')
    setUploadingLogo(true)
    try {
      const isImage = file.type.startsWith('image/') || !file.type
      const uploadBlob: Blob = isImage ? await compressImage(file, LOGO_MAX_DIMENSION).catch(() => file) : file
      if (uploadBlob.size > LOGO_MAX_BYTES) {
        setLogoError(t('doctors.photo_too_large'))
        return
      }
      const compressed = uploadBlob !== (file as Blob)
      const fileName = compressed ? file.name.replace(/\.[^.]+$/, '') + '.jpg' : file.name
      const contentType = compressed ? 'image/jpeg' : file.type
      const fileBase64 = await blobToBase64(uploadBlob)
      const { key, url } = await api.post('/clinic/logo', { fileBase64, fileName, contentType })
      setForm(f => ({ ...f, logo_key: key } as any))
      setLogoPreviewUrl(url)
    } catch (err: any) {
      setLogoError(err.message ?? t('doctors.photo_upload_error'))
    } finally {
      setUploadingLogo(false)
    }
  }

  const removeLogo = () => {
    setForm(f => ({ ...f, logo_key: '', logo_url: '' } as any))
    setLogoPreviewUrl('')
  }

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

  if (loading) return <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>

  return (
    <div className={tab === 'doctors' ? 'max-w-4xl flex flex-col gap-6' : 'max-w-2xl flex flex-col gap-6'}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('clinic.title')}</h1>
          <p className="text-sm text-slate-500">{t('clinic.subtitle')}</p>
        </div>
      </div>

      {canManageDoctors && (
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <button
            type="button"
            onClick={() => setTab('info')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'info' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Building2 className="w-4 h-4" />{t('clinic.tabs.info')}
          </button>
          <button
            type="button"
            onClick={() => setTab('doctors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'doctors' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Stethoscope className="w-4 h-4" />{t('clinic.tabs.doctors')}
          </button>
        </div>
      )}

      {tab === 'doctors' && canManageDoctors ? (
        <DoctorPermissionsPanel />
      ) : (
      <>
      {/* Main clinic config */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="relative w-20 h-20 rounded-xl flex-shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden group"
            title={t('clinic.logo_upload')}
          >
            {logoPreviewUrl ? (
              <img src={logoPreviewUrl} alt="" className="w-full h-full object-contain" />
            ) : uploadingLogo ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-white" />
            </span>
          </button>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('clinic.logo')}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50">
                {t('clinic.logo_upload')}
              </button>
              {logoPreviewUrl && (
                <button type="button" onClick={removeLogo} className="flex items-center gap-0.5 text-xs font-medium text-slate-400 hover:text-red-500">
                  <X className="w-3 h-3" />{t('clinic.logo_remove')}
                </button>
              )}
            </div>
            {logoError && <span className="text-xs text-red-500">{logoError}</span>}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { handleLogoSelect(e.target.files?.[0]); e.target.value = '' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('clinic.trade_name')} value={(form as any).trade_name ?? (form as any).tradeName ?? ''} onChange={v => set('trade_name', v)} />
          <Field label={t('clinic.legal_name')} value={(form as any).legal_name ?? (form as any).legalName ?? ''} onChange={v => set('legal_name', v)} />
        </div>
        <Field label={t('clinic.address')} value={(form.address as string) ?? ''} onChange={v => set('address', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('clinic.city')} value={(form as any).city ?? ''} onChange={v => set('city', v)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('clinic.province')}</label>
            <select
              value={(form as any).province ?? ''}
              onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
              className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">{t('clinic.province_placeholder')}</option>
              {PROVINCIAS_ES.map((p, i) => <option key={p} value={p}>{provinceLabels[i] ?? p}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-400 -mt-2">{t('clinic.province_hint')}</p>
        <Field label={t('clinic.directions_url')} value={(form as any).directions_url ?? ''} onChange={v => set('directions_url', v)} type="url" />
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('clinic.phone')} value={(form.phone as string) ?? ''} onChange={v => set('phone', v)} type="tel" />
          <Field label={t('clinic.email')} value={(form.email as string) ?? ''} onChange={v => set('email', v)} type="email" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('clinic.tax_id')} value={(form.taxId as string) ?? (form as any).tax_id ?? ''} onChange={v => set('taxId', v)} />
          <Field label={t('clinic.nika_number')} value={(form as any).nika_number ?? ''} onChange={v => set('nika_number', v)} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {saved && <span className="text-sm text-emerald-600 font-medium">✓ {t('clinic.save_success')}</span>}
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
      </>
      )}
    </div>
  )
}
