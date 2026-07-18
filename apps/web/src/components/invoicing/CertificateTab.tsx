import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Upload, Lock } from 'lucide-react'
import { api } from '@/lib/api'

interface CertificateInfo {
  id: string
  issuer: string | null
  subject_name: string | null
  valid_from: string
  valid_until: string
  status: string
  uploaded_at: string
  days_until_expiry: number
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function CertificateTab() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/clinic-certificates/status')
      setCertificate(data.certificate)
      setShowForm(!data.certificate)
    } catch {
      setCertificate(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

  const expiryColor = (days: number) => {
    if (days > 60) return { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'text-emerald-500' }
    if (days >= 30) return { badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'text-amber-500' }
    return { badge: 'bg-red-50 text-red-700 border-red-200', icon: 'text-red-500' }
  }

  const handleUpload = async () => {
    setError('')
    if (!file) { setError(t('certificateTab.form.errors.fileRequired')); return }
    if (!password) { setError(t('certificateTab.form.errors.passwordRequired')); return }
    setSaving(true)
    try {
      const file_base64 = await fileToBase64(file)
      await api.post('/clinic-certificates', { file_base64, file_name: file.name, password })
      setFile(null)
      setPassword('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      await load()
    } catch (err: any) {
      setError(err.message ?? t('certificateTab.form.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {certificate && !showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${expiryColor(certificate.days_until_expiry).icon}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{certificate.issuer ?? t('certificateTab.unknownIssuer')}</p>
                <p className="text-xs text-slate-500">{certificate.subject_name}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${expiryColor(certificate.days_until_expiry).badge}`}>
              {certificate.days_until_expiry >= 0
                ? t('certificateTab.expiresIn', { days: certificate.days_until_expiry })
                : t('certificateTab.expired')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{t('certificateTab.validFrom')}</p>
              <p className="text-slate-700">{fmtDate(certificate.valid_from)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{t('certificateTab.validUntil')}</p>
              <p className="text-slate-700">{fmtDate(certificate.valid_until)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="self-start px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
          >
            {t('certificateTab.replaceButton')}
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          {!certificate && (
            <p className="text-sm text-slate-600">{t('certificateTab.form.introNoCertificate')}</p>
          )}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <Lock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">{t('certificateTab.form.securityNotice')}</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('certificateTab.form.fileLabel')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".p12,.pfx"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:text-sm file:font-medium hover:file:bg-emerald-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('certificateTab.form.passwordLabel')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpload}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />{saving ? t('common.saving') : t('certificateTab.form.submit')}
            </button>
            {certificate && (
              <button onClick={() => { setShowForm(false); setError(''); setFile(null); setPassword('') }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                {t('common.cancel')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
