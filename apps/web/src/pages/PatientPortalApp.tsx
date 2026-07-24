import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, ClipboardList, Camera, Download, ChevronDown, ChevronUp, LogOut, ArrowLeft, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { clearSession } from '@/lib/auth'
import { PreviewBanner } from '@/components/preview/PreviewBanner'
import { WelcomeMediaProvider } from '@/context/WelcomeMediaContext'
import { WelcomeMediaModal } from '@/components/media/WelcomeMediaModal'
import { PatientAdModal } from '@/components/media/PatientAdModal'

type Tab = 'consents' | 'clinical' | 'photos'

interface PatientPortalAppProps {
  previewPatientId?: string
  onExitPreview?: () => void
}

// Adapts the admin-scoped endpoints (/consents, /clinical-records, /photo-sessions)
// to the shape the tabs below expect, since a preview patient has no login of its own.
function normalizeConsent(c: any) {
  return { ...c, treatment_type: c.template?.treatment_type ?? c.template?.treatmentType, doctor_name: c.doctor?.name }
}
function normalizeClinical(r: any) {
  return { ...r, doctor_name: r.doctor?.name }
}
function normalizeSession(s: any) {
  return { ...s, doctor_name: s.doctor?.name }
}

export default function PatientPortalApp({ previewPatientId, onExitPreview }: PatientPortalAppProps) {
  const { t } = useTranslation()
  const [tab, setTab]         = useState<Tab>('consents')
  const [me, setMe]           = useState<any>(null)
  const [consents, setConsents]   = useState<any[]>([])
  const [clinical, setClinical]   = useState<any[]>([])
  const [photos, setPhotos]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isPreview = !!previewPatientId

  useEffect(() => {
    if (isPreview) {
      Promise.allSettled([
        api.get('/patients'),
        api.get('/consents'),
        api.get(`/clinical-records?patientId=${previewPatientId}`),
        api.get(`/photo-sessions?patientId=${previewPatientId}`),
      ]).then(([patients, c, cr, ps]) => {
        if (patients.status === 'fulfilled') {
          const list = patients.value
          setMe(Array.isArray(list) ? list.find((p: any) => p.id === previewPatientId) : null)
        } else console.error('[PatientPortalApp] preview /patients failed:', patients.reason)
        if (c.status === 'fulfilled') {
          setConsents(Array.isArray(c.value) ? c.value.filter((x: any) => x.patient_id === previewPatientId).map(normalizeConsent) : [])
        } else console.error('[PatientPortalApp] preview /consents failed:', c.reason)
        if (cr.status === 'fulfilled') {
          setClinical(Array.isArray(cr.value) ? cr.value.map(normalizeClinical) : [])
        } else console.error('[PatientPortalApp] preview /clinical-records failed:', cr.reason)
        if (ps.status === 'fulfilled') {
          setPhotos(Array.isArray(ps.value) ? ps.value.map(normalizeSession) : [])
        } else console.error('[PatientPortalApp] preview /photo-sessions failed:', ps.reason)
      }).finally(() => setLoading(false))
      return
    }
    Promise.allSettled([
      api.get('/patient/me'),
      api.get('/patient/consents'),
      api.get('/patient/clinical-records'),
      api.get('/patient/photo-sessions'),
    ]).then(([m, c, cr, ps]) => {
      if (m.status === 'fulfilled') setMe(m.value)
      else console.error('[PatientPortalApp] /patient/me failed:', m.reason)
      if (c.status === 'fulfilled') setConsents(Array.isArray(c.value) ? c.value : [])
      else console.error('[PatientPortalApp] /patient/consents failed:', c.reason)
      if (cr.status === 'fulfilled') setClinical(Array.isArray(cr.value) ? cr.value : [])
      else console.error('[PatientPortalApp] /patient/clinical-records failed:', cr.reason)
      if (ps.status === 'fulfilled') setPhotos(Array.isArray(ps.value) ? ps.value : [])
      else console.error('[PatientPortalApp] /patient/photo-sessions failed:', ps.reason)
    }).finally(() => setLoading(false))
  }, [isPreview, previewPatientId])

  const logout = () => { clearSession(); window.location.href = '/' }

  const tabs: { key: Tab; label: string; icon: typeof FileText; count: number }[] = [
    { key: 'consents', label: t('patientPortalApp.tabs.consents'), icon: FileText,      count: consents.length },
    { key: 'clinical', label: t('patientPortalApp.tabs.clinical'), icon: ClipboardList, count: clinical.length },
    { key: 'photos',   label: t('patientPortalApp.tabs.photos'),   icon: Camera,        count: photos.length },
  ]

  return (
    <WelcomeMediaProvider>
    <div className="min-h-screen bg-slate-50 font-sans">
      <WelcomeMediaModal />
      <PatientAdModal />
      {isPreview && onExitPreview && <PreviewBanner role="patient" onExit={onExitPreview} />}
      {/* Header */}
      <header className="bg-[#0D1B2E] text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xl font-black tracking-tight">
              Consents<span className="text-[#C9A84C]">Pro</span>
            </p>
            {me && (
              <p className="text-xs text-slate-400 mt-0.5">{me.full_name ?? `${me.first_name} ${me.last_name}`}</p>
            )}
          </div>
          {me?.clinic_name && (
            <p className="text-xs text-slate-400 text-right max-w-[140px] leading-tight">{me.clinic_name}</p>
          )}
          {!isPreview && (
            <button
              onClick={logout}
              className="ml-3 flex-shrink-0 text-white/80 hover:text-white text-sm border border-white/20 rounded-lg px-2.5 md:px-3 py-1.5 hover:bg-white/10 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          )}
        </div>
        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map(tabItem => {
            const Icon = tabItem.icon
            const active = tab === tabItem.key
            return (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  active ? 'border-[#C9A84C] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tabItem.label}
                {tabItem.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-[#C9A84C] text-[#0D1B2E]' : 'bg-slate-700 text-slate-300'}`}>
                    {tabItem.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'consents' && <ConsentsTab consents={consents} isPreview={isPreview} />}
            {tab === 'clinical' && <ClinicalTab records={clinical} />}
            {tab === 'photos'   && <PhotosTab sessions={photos} />}
          </>
        )}
      </main>
    </div>
    </WelcomeMediaProvider>
  )
}

/* ─── Consents Tab ─── */
function ConsentsTab({ consents, isPreview }: { consents: any[]; isPreview: boolean }) {
  const { t } = useTranslation()
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  if (consents.length === 0) return <EmptyState icon={FileText} text={t('patientPortalApp.consents.empty')} />

  const handleOpenPdf = async (consentId: string) => {
    setPdfError(null)
    setPdfLoadingId(consentId)
    try {
      // En modo preview (personal de clínica viendo el portal "como paciente")
      // se reutiliza el endpoint interno ya usado por el resto de la app; el
      // paciente real usa su propio endpoint aislado por titularidad.
      const { url } = await api.get(isPreview ? `/pdf/${consentId}` : `/patient/consents/${consentId}/pdf`)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      console.error('[PatientPortalApp] pdf fetch failed:', err)
      setPdfError(consentId)
    } finally {
      setPdfLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {consents.map(c => (
        <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{c.treatment_type ?? t('patientPortalApp.consents.default_name')}</p>
              {c.doctor_name && <p className="text-xs text-slate-400 mt-0.5">{t('patientPortalApp.consents.doctor', { name: c.doctor_name })}</p>}
              <p className="text-xs text-slate-400 mt-0.5">
                {c.signed_at
                  ? t('patientPortalApp.consents.signed_on', { date: new Date(c.signed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) })
                  : new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                c.status === 'signed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {c.status === 'signed' ? t('patientPortalApp.consents.status_signed') : t('patientPortalApp.consents.status_pending')}
              </span>
            </div>
          </div>
          {c.status === 'signed' && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleOpenPdf(c.id)}
                disabled={pdfLoadingId === c.id}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {pdfLoadingId === c.id ? t('patientPortalApp.consents.pdf_loading') : t('patientPortalApp.consents.view_download')}
              </button>
              {pdfError === c.id && <p className="text-xs text-red-500 mt-1">{t('patientPortalApp.consents.pdf_error')}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Embarazo/tabaquismo/alcohol/drogas: solo se muestran los que constan
// (true/false explícito) — un registro sin preguntar/marcar queda en null.
function clinicalHabits(r: any, t: (key: string) => string) {
  return ([
    ['is_pregnant', t('clinicalRecordForm.is_pregnant'), null],
    ['tobacco_use', t('clinicalRecordForm.tobacco_use'), 'tobacco_quantity'],
    ['alcohol_use', t('clinicalRecordForm.alcohol_use'), 'alcohol_quantity'],
    ['drug_use', t('clinicalRecordForm.drug_use'), 'drug_quantity'],
  ] as const)
    .filter(([key]) => r[key] === true || r[key] === false)
    .map(([key, label, quantityKey]) => {
      const value = r[key] === true
        ? (quantityKey && r[quantityKey] ? `${t('clinicalRecordForm.tri_state.yes')} (${r[quantityKey]})` : t('clinicalRecordForm.tri_state.yes'))
        : t('clinicalRecordForm.tri_state.no')
      return { label, value, alert: r[key] === true }
    })
}

/* ─── Clinical Tab ─── */
function ClinicalTab({ records }: { records: any[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<string | null>(null)
  if (records.length === 0) return <EmptyState icon={ClipboardList} text={t('patientPortalApp.clinical.empty')} />
  return (
    <div className="flex flex-col gap-3">
      {records.map(r => {
        const isOpen = open === r.id
        return (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : r.id)}
              className="w-full px-4 py-4 flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{r.reason_for_visit ?? r.diagnosis ?? t('patientPortalApp.clinical.default_name')}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {r.date ? new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                  {r.doctor_name && t('patientPortalApp.clinical.doctor_suffix', { name: r.doctor_name })}
                </p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex flex-col gap-3">
                {clinicalHabits(r, t).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {clinicalHabits(r, t).map(h => (
                      <span
                        key={h.label}
                        className={`text-xs font-medium px-2 py-1 rounded-full ${h.alert ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {h.label}: {h.value}
                      </span>
                    ))}
                  </div>
                )}
                {[
                  { label: t('patientPortalApp.clinical.fields.anamnesis'),             value: r.anamnesis },
                  { label: t('patientPortalApp.clinical.fields.allergies'),              value: r.allergies },
                  { label: t('patientPortalApp.clinical.fields.current_medications'),     value: r.current_medications },
                  { label: t('clinicalRecordForm.physical_exam'),                        value: r.physical_exam },
                  { label: t('patientPortalApp.clinical.fields.diagnosis'),          value: r.diagnosis },
                  { label: t('patientPortalApp.clinical.fields.treatment_plan'),   value: r.treatment_plan },
                  { label: t('patientPortalApp.clinical.fields.notes'),         value: r.notes },
                ].filter(f => f.value).map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{f.label}</p>
                    <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-line">{f.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Photos Tab ─── */
function PhotosTab({ sessions }: { sessions: any[] }) {
  const { t } = useTranslation()
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState<{ a: number; b: number } | null>(null)

  if (sessions.length === 0) return <EmptyState icon={Camera} text={t('patientPortalApp.photos.empty')} />

  const session = sessions.find(s => s.id === activeSession)

  if (activeSession && session) {
    const photos = session.photos ?? []
    return (
      <div>
        <button onClick={() => { setActiveSession(null); setCompareMode(null) }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeft className="w-4 h-4" /> {t('patientPortalApp.photos.back_to_sessions')}
        </button>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
          <p className="font-semibold text-slate-800">{session.name ?? t('patientPortalApp.photos.default_session_name')}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {session.session_date ? new Date(session.session_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
            {session.doctor_name && t('patientPortalApp.photos.doctor_suffix', { name: session.doctor_name })}
          </p>
        </div>

        {/* Compare mode */}
        {compareMode && (
          <div className="mb-4 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{t('patientPortalApp.photos.compare_title')}</p>
            <div className="grid grid-cols-2 gap-2">
              {[compareMode.a, compareMode.b].map((idx, i) => (
                <div key={idx} className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{i === 0 ? t('patientPortalApp.photos.before') : t('patientPortalApp.photos.after')}</p>
                  <img src={photos[idx]?.url} alt="" className="rounded-xl w-full object-cover aspect-square" />
                </div>
              ))}
            </div>
            <button onClick={() => setCompareMode(null)} className="mt-2 text-xs text-slate-400 hover:text-slate-600">
              {t('patientPortalApp.photos.close_compare')}
            </button>
          </div>
        )}

        {/* Photo grid */}
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p: any, idx: number) => (
            <div key={p.id} className="relative group">
              <img src={p.url} alt={p.original_name} className="rounded-xl w-full object-cover aspect-square" />
              {photos.length >= 2 && !compareMode && (
                <button
                  onClick={() => setCompareMode({ a: idx, b: idx === 0 ? 1 : 0 })}
                  className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {t('patientPortalApp.photos.compare_button')}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map(s => {
        const cover = s.photos?.[0]
        return (
          <button
            key={s.id}
            onClick={() => setActiveSession(s.id)}
            className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex items-center gap-3 text-left hover:shadow-md transition-shadow"
          >
            {cover ? (
              <img src={cover.url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-slate-300" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{s.name ?? t('patientPortalApp.photos.default_session_name')}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {s.session_date ? new Date(s.session_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
              </p>
              <p className="text-xs text-slate-400">{t('patientPortalApp.photos.photo_count', { count: s.photos?.length ?? 0 })}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 ml-auto flex-shrink-0" />
          </button>
        )
      })}
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: typeof FileText; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-10 h-10 text-slate-200 mb-3" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}
