import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeEuro, Plus, Eye, FilterX, ShieldAlert, CheckCircle2, Clock, Ban } from 'lucide-react'
import { api } from '@/lib/api'
import { InvoiceModal } from '@/components/invoicing/InvoiceModal'
import { InvoiceView } from '@/components/invoicing/InvoiceView'

const EMPTY_FILTERS = { date_from: '', date_to: '', patient_id: '', status: '', series: '', q: '' }

const STATUS_BADGE: Record<string, string> = {
  emitida: 'bg-emerald-50 text-emerald-700',
  anulada: 'bg-red-50 text-red-600',
  rectificada: 'bg-amber-50 text-amber-700',
}

export default function Invoicing() {
  const { t } = useTranslation()
  const [invoices, setInvoices] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [clinic, setClinic] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [integrityIssues, setIntegrityIssues] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.patient_id) params.set('patient_id', filters.patient_id)
      if (filters.status) params.set('status', filters.status)
      if (filters.series) params.set('series', filters.series)
      if (filters.q) params.set('q', filters.q)
      const data = await api.get(`/invoices?${params.toString()}`)
      setInvoices(Array.isArray(data) ? data : [])
    } catch {
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([
      api.get('/patients').catch(() => []),
      api.get('/clinic').catch(() => ({})),
    ]).then(([p, c]) => {
      setPatients(Array.isArray(p) ? p : [])
      setClinic(c)
    })
    api.get('/invoices/integrity/check').then((r: any) => setIntegrityIssues(Array.isArray(r?.issues) ? r.issues.length : 0)).catch(() => {})
  }, [])

  const handleSave = async (data: any) => {
    try {
      await api.post('/invoices', data)
      await load()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const openView = async (inv: any) => {
    const full = await api.get(`/invoices/${inv.id}`)
    setViewing(full)
  }

  const closeView = () => setViewing(null)
  const handleCancelled = async () => {
    setViewing(null)
    await load()
  }

  const patientName = (p: any) => p ? (p.full_name ?? p.fullName ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) : '—'
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
  const fmtMoney = (n: number) => (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <BadgeEuro className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('invoicing.title')}</h1>
            <p className="text-sm text-slate-500">{t('invoicing.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />{t('invoicing.newInvoice')}
        </button>
      </div>

      {integrityIssues !== null && integrityIssues > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">{t('invoicing.integrityAlarm', { count: integrityIssues })}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('invoicing.from')}</label>
          <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('invoicing.to')}</label>
          <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('invoicing.patient')}</label>
          <select value={filters.patient_id} onChange={e => setFilters(f => ({ ...f, patient_id: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">{t('invoicing.all')}</option>
            {patients.map(p => <option key={p.id} value={p.id}>{patientName(p)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('invoicing.status')}</label>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">{t('invoicing.all')}</option>
            <option value="emitida">{t('invoicing.statusEmitida')}</option>
            <option value="anulada">{t('invoicing.statusAnulada')}</option>
            <option value="rectificada">{t('invoicing.statusRectificada')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('invoicing.search')}</label>
          <input value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} placeholder={t('invoicing.searchPlaceholder')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <button
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
        >
          <FilterX className="w-4 h-4" />{t('invoicing.clearFilters')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <BadgeEuro className="w-10 h-10 opacity-20" />
            <p>{t('invoicing.noResults')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">{t('invoicing.colNumber')}</th>
                  <th className="px-4 py-3 font-semibold">{t('invoicing.colDate')}</th>
                  <th className="px-4 py-3 font-semibold">{t('invoicing.colRecipient')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('invoicing.colTotal')}</th>
                  <th className="px-4 py-3 font-semibold">{t('invoicing.colStatus')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{t('invoicing.colAeat')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('invoicing.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(inv.issue_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.recipient_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmtMoney(inv.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {inv.status === 'anulada' && <Ban className="w-3 h-3" />}
                        {t(`invoicing.status${inv.status.charAt(0).toUpperCase()}${inv.status.slice(1)}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inv.aeat_sent_at ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openView(inv)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <InvoiceModal
          patients={patients}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {viewing && (
        <InvoiceView invoice={viewing} clinic={clinic} onClose={closeView} onCancelled={handleCancelled} />
      )}
    </div>
  )
}
