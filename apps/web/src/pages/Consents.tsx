import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Search, FilePlus, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { ConsentModal } from '@/components/consents/ConsentModal'

const STATUS_CONFIG = {
  signed:  { icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50',  label: 'consents.status.signed'  },
  pending: { icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50',    label: 'consents.status.pending' },
  revoked: { icon: XCircle,       color: 'text-red-500',     bg: 'bg-red-50',      label: 'consents.status.revoked' },
  expired: { icon: AlertCircle,   color: 'text-slate-400',   bg: 'bg-slate-50',    label: 'consents.status.expired' },
}

export default function Consents() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)

  const initialPatient = searchParams.get('patient') ?? undefined

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/consents')
      setRecords(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (initialPatient) setModalOpen(true) }, [initialPatient])

  const filtered = useMemo(() => {
    let r = records
    if (statusFilter !== 'all') r = r.filter(c => c.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(c =>
        c.patient?.fullName?.toLowerCase().includes(q) ||
        c.template?.treatmentType?.toLowerCase().includes(q) ||
        c.doctor?.name?.toLowerCase().includes(q)
      )
    }
    return r
  }, [records, search, statusFilter])

  const stats = useMemo(() => ({
    total: records.length,
    signed: records.filter(c => c.status === 'signed').length,
    pending: records.filter(c => c.status === 'pending').length,
  }), [records])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('consents.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{stats.total} total · {stats.signed} firmados · {stats.pending} pendientes</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <FilePlus className="w-4 h-4" />
          {t('consents.add')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('consents.search')}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {['all', 'pending', 'signed', 'revoked'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s === 'all' ? 'Todos' : t(`consents.status.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">{t('consents.no_results')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[t('consents.patient'), t('consents.treatment'), t('consents.doctor'), t('consents.language'), t('consents.signed_at'), 'Estado'].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => {
                  const cfg = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
                  const Icon = cfg.icon
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{c.patient?.fullName ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{c.template?.treatmentType ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{c.doctor?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs uppercase">{c.language}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {c.signedAt ? new Date(c.signedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {t(cfg.label)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ConsentModal
          initialPatientId={initialPatient}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load() }}
        />
      )}
    </div>
  )
}
