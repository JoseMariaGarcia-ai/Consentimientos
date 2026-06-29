import { useState, useEffect } from 'react'
import { FileText, ClipboardList, Camera, Download, ChevronDown, ChevronUp, LogOut, ArrowLeft, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { clearSession } from '@/lib/auth'

type Tab = 'consents' | 'clinical' | 'photos'

export default function PatientPortalApp() {
  const [tab, setTab]         = useState<Tab>('consents')
  const [me, setMe]           = useState<any>(null)
  const [consents, setConsents]   = useState<any[]>([])
  const [clinical, setClinical]   = useState<any[]>([])
  const [photos, setPhotos]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/patient/me'),
      api.get('/patient/consents'),
      api.get('/patient/clinical-records'),
      api.get('/patient/photo-sessions'),
    ]).then(([m, c, cr, ps]) => {
      setMe(m)
      setConsents(Array.isArray(c) ? c : [])
      setClinical(Array.isArray(cr) ? cr : [])
      setPhotos(Array.isArray(ps) ? ps : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const logout = () => { clearSession(); window.location.href = '/' }

  const tabs: { key: Tab; label: string; icon: typeof FileText; count: number }[] = [
    { key: 'consents', label: 'Mis Consentimientos', icon: FileText,      count: consents.length },
    { key: 'clinical', label: 'Mi Historia Clínica', icon: ClipboardList, count: clinical.length },
    { key: 'photos',   label: 'Mis Fotos',           icon: Camera,        count: photos.length },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
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
          <button onClick={logout} className="p-2 rounded-lg hover:bg-white/10 transition-colors ml-3">
            <LogOut className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  active ? 'border-[#C9A84C] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {t.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-[#C9A84C] text-[#0D1B2E]' : 'bg-slate-700 text-slate-300'}`}>
                    {t.count}
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
            {tab === 'consents' && <ConsentsTab consents={consents} />}
            {tab === 'clinical' && <ClinicalTab records={clinical} />}
            {tab === 'photos'   && <PhotosTab sessions={photos} />}
          </>
        )}
      </main>
    </div>
  )
}

/* ─── Consents Tab ─── */
function ConsentsTab({ consents }: { consents: any[] }) {
  if (consents.length === 0) return <EmptyState icon={FileText} text="Todavía no tienes consentimientos firmados." />
  return (
    <div className="flex flex-col gap-3">
      {consents.map(c => (
        <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{c.treatment_type ?? 'Consentimiento'}</p>
              {c.doctor_name && <p className="text-xs text-slate-400 mt-0.5">Dr. {c.doctor_name}</p>}
              <p className="text-xs text-slate-400 mt-0.5">
                {c.signed_at
                  ? `Firmado el ${new Date(c.signed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`
                  : new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                c.status === 'signed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {c.status === 'signed' ? 'Firmado' : 'Pendiente'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Clinical Tab ─── */
function ClinicalTab({ records }: { records: any[] }) {
  const [open, setOpen] = useState<string | null>(null)
  if (records.length === 0) return <EmptyState icon={ClipboardList} text="Tu historia clínica está vacía." />
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
                <p className="text-sm font-semibold text-slate-800">{r.reason_for_visit ?? r.diagnosis ?? 'Consulta'}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {r.date ? new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                  {r.doctor_name && ` · Dr. ${r.doctor_name}`}
                </p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex flex-col gap-3">
                {[
                  { label: 'Diagnóstico',          value: r.diagnosis },
                  { label: 'Anamnesis',             value: r.anamnesis },
                  { label: 'Medicación actual',     value: r.current_medications },
                  { label: 'Alergias',              value: r.allergies },
                  { label: 'Plan de tratamiento',   value: r.treatment_plan },
                  { label: 'Observaciones',         value: r.notes },
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
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState<{ a: number; b: number } | null>(null)

  if (sessions.length === 0) return <EmptyState icon={Camera} text="Todavía no hay sesiones de fotos." />

  const session = sessions.find(s => s.id === activeSession)

  if (activeSession && session) {
    const photos = session.photos ?? []
    return (
      <div>
        <button onClick={() => { setActiveSession(null); setCompareMode(null) }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver a sesiones
        </button>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
          <p className="font-semibold text-slate-800">{session.name ?? 'Sesión fotográfica'}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {session.session_date ? new Date(session.session_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
            {session.doctor_name && ` · Dr. ${session.doctor_name}`}
          </p>
        </div>

        {/* Compare mode */}
        {compareMode && (
          <div className="mb-4 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Comparativa antes / después</p>
            <div className="grid grid-cols-2 gap-2">
              {[compareMode.a, compareMode.b].map((idx, i) => (
                <div key={idx} className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{i === 0 ? 'Antes' : 'Después'}</p>
                  <img src={photos[idx]?.url} alt="" className="rounded-xl w-full object-cover aspect-square" />
                </div>
              ))}
            </div>
            <button onClick={() => setCompareMode(null)} className="mt-2 text-xs text-slate-400 hover:text-slate-600">
              Cerrar comparativa
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
                  Comparar
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
              <p className="text-sm font-semibold text-slate-800 truncate">{s.name ?? 'Sesión fotográfica'}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {s.session_date ? new Date(s.session_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
              </p>
              <p className="text-xs text-slate-400">{s.photos?.length ?? 0} fotos</p>
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
