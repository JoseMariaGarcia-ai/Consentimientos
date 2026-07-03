import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, FileText, Stethoscope, Clock, TrendingUp, ClipboardList, Camera } from 'lucide-react'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

interface Stats {
  patients: number
  doctors: number
  consents: number
  pending: number
  signed: number
}

function patientName(p: any): string {
  if (!p) return '—'
  const name = p.full_name ?? p.fullName ?? [p.first_name ?? p.firstName, p.last_name ?? p.lastName].filter(Boolean).join(' ')
  return name || '—'
}

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ patients: 0, doctors: 0, consents: 0, pending: 0, signed: 0 })
  const [recentConsents, setRecentConsents]   = useState<any[]>([])
  const [recentClinical, setRecentClinical]   = useState<any[]>([])
  const [recentPhotos,   setRecentPhotos]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.allSettled([
      api.get('/patients'),
      api.get('/doctors'),
      api.get('/consents'),
      api.get('/clinical-records'),
      api.get('/photo-sessions'),
    ]).then(([patients, doctors, consents, clinical, photos]) => {
      const asArray = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []
      const p  = asArray(patients)
      const d  = asArray(doctors)
      const c  = asArray(consents)
      const cr = asArray(clinical)
      const ps = asArray(photos)
      setStats({
        patients: p.length,
        doctors:  d.length,
        consents: c.length,
        pending:  c.filter((x: any) => x.status === 'pending').length,
        signed:   c.filter((x: any) => x.status === 'signed').length,
      })
      setRecentConsents(c.slice(0, 5))
      setRecentClinical(cr.slice(0, 5))
      setRecentPhotos(ps.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: t('nav.patients'),     value: stats.patients, icon: Users,       color: 'text-blue-600',    bg: 'bg-blue-50',    path: '/patients'  },
    { label: t('nav.consents'),     value: stats.consents, icon: FileText,    color: 'text-purple-600',  bg: 'bg-purple-50',  path: '/consents'  },
    { label: t('nav.doctors'),      value: stats.doctors,  icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/doctors'   },
    { label: 'Pendientes de firma', value: stats.pending,  icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50',   path: '/consents?status=pending' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumen de actividad</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{loading ? '—' : value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Progress bar signed vs pending */}
      {stats.consents > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Tasa de firma
            </div>
            <span className="text-sm font-bold text-slate-800">
              {Math.round((stats.signed / stats.consents) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${(stats.signed / stats.consents) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>{stats.signed} firmados</span>
            <span>{stats.pending} pendientes</span>
          </div>
        </div>
      )}

      {/* Recent activity — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent consents */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-semibold text-slate-700">Últimos consentimientos</h2>
            </div>
            <button onClick={() => navigate('/consents')} className="text-xs text-blue-600 hover:underline">Ver todos →</button>
          </div>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Cargando…</div>
          ) : recentConsents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Sin consentimientos</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentConsents.map(c => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{patientName(c.patient)}</p>
                    <p className="text-xs text-slate-400 truncate">{c.template?.treatmentType ?? c.template?.treatment_type ?? '—'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                    c.status === 'signed'  ? 'bg-emerald-50 text-emerald-600' :
                    c.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {String(t(`consents.status.${c.status}`, c.status))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent clinical records */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-teal-500" />
              <h2 className="text-sm font-semibold text-slate-700">Últimas historias clínicas</h2>
            </div>
            <button onClick={() => navigate('/clinical-records')} className="text-xs text-blue-600 hover:underline">Ver todas →</button>
          </div>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Cargando…</div>
          ) : recentClinical.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Sin historias clínicas</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentClinical.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{patientName(r.patient)}</p>
                    <p className="text-xs text-slate-400 truncate">{r.reason_for_visit ?? r.diagnosis ?? '—'}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {r.date ? new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent photo sessions */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-700">Últimas sesiones de fotos</h2>
            </div>
            <button onClick={() => navigate('/photos')} className="text-xs text-blue-600 hover:underline">Ver todas →</button>
          </div>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Cargando…</div>
          ) : recentPhotos.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Sin sesiones fotográficas</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentPhotos.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{patientName(s.patient)}</p>
                    <p className="text-xs text-slate-400 truncate">{s.name ?? '—'}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {s.session_date ? new Date(s.session_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
