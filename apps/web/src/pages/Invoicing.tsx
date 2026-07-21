import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeEuro, Plus, Eye, FileDown, Mail, FilterX, ShieldAlert, CheckCircle2, Clock, Ban, ShieldCheck, FlaskConical, Users, Wallet, Hash } from 'lucide-react'
import { api } from '@/lib/api'
import { InvoiceModal } from '@/components/invoicing/InvoiceModal'
import { InvoiceView } from '@/components/invoicing/InvoiceView'
import { PatientCombobox } from '@/components/patients/PatientCombobox'
import { CertificateTab } from '@/components/invoicing/CertificateTab'
import { BillingClientsList } from '@/components/invoicing/BillingClientsList'
import { InvoiceSeriesConfig } from '@/components/invoicing/InvoiceSeriesConfig'
import { SendInvoiceEmailModal } from '@/components/invoicing/SendInvoiceEmailModal'
import { PaymentModal } from '@/components/invoicing/PaymentModal'
import { invoicePdfBlob } from '@/components/invoicing/InvoicePdfButton'
import { useAuth } from '@/lib/auth'

const EMPTY_FILTERS = { date_from: '', date_to: '', patient_id: '', status: '', series: '', q: '', recipient_type: '', payment_status: '' }

const STATUS_BADGE: Record<string, string> = {
  emitida: 'bg-emerald-50 text-emerald-700',
  anulada: 'bg-red-50 text-red-600',
  rectificada: 'bg-amber-50 text-amber-700',
}

const PAYMENT_BADGE: Record<string, string> = {
  pendiente: 'bg-red-50 text-red-600',
  parcial: 'bg-amber-50 text-amber-700',
  cobrada: 'bg-emerald-50 text-emerald-700',
}

export default function Invoicing() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const canManageCertificate = role === 'clinica' || role === 'superadmin'
  const [tab, setTab] = useState<'invoices' | 'certificate' | 'clients' | 'numbering'>('invoices')
  const [aeatMode, setAeatMode] = useState<'test' | 'production'>('test')
  const [invoices, setInvoices] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [billingClients, setBillingClients] = useState<any[]>([])
  const [clinic, setClinic] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing] = useState<any | null>(null)
  const [emailing, setEmailing] = useState<any | null>(null)
  const [payingInvoice, setPayingInvoice] = useState<any | null>(null)
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
      if (filters.recipient_type) params.set('recipient_type', filters.recipient_type)
      if (filters.payment_status) params.set('payment_status', filters.payment_status)
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

  const loadBillingClients = useCallback(() => {
    api.get('/billing-clients').then((c: any) => setBillingClients(Array.isArray(c) ? c : [])).catch(() => {})
  }, [])

  useEffect(() => {
    Promise.all([
      api.get('/patients').catch(() => []),
      api.get('/clinic').catch(() => ({})),
    ]).then(([p, c]) => {
      setPatients(Array.isArray(p) ? p : [])
      setClinic(c)
    })
    loadBillingClients()
    api.get('/invoices/integrity/check').then((r: any) => setIntegrityIssues(Array.isArray(r?.issues) ? r.issues.length : 0)).catch(() => {})
    api.get('/clinic-certificates/mode').then((r: any) => setAeatMode(r?.mode === 'production' ? 'production' : 'test')).catch(() => {})
  }, [loadBillingClients])

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

  const handleViewClientInvoices = (client: any) => {
    setFilters(f => ({ ...EMPTY_FILTERS, q: client.tax_id }))
    setTab('invoices')
  }

  const openEmailModal = async (inv: any) => {
    const full = await api.get(`/invoices/${inv.id}`)
    setEmailing(full)
  }

  const defaultEmailFor = (inv: any) => inv?.patient?.email || inv?.billing_client?.email || ''

  const handlePdfAction = async (inv: any, action: 'view' | 'download') => {
    const full = await api.get(`/invoices/${inv.id}`)
    const blob = await invoicePdfBlob(full, clinic)
    const url = URL.createObjectURL(blob)
    if (action === 'view') {
      window.open(url, '_blank')
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = `factura_${inv.invoice_number}.pdf`
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
  const fmtMoney = (n: number) => (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  const recipientTypeLabel = (rt: string) => t(`invoicing.recipientType${rt.charAt(0).toUpperCase()}${rt.slice(1)}`)

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
        {tab === 'invoices' && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />{t('invoicing.newInvoice')}
          </button>
        )}
      </div>

      {aeatMode === 'test' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <FlaskConical className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">{t('invoicing.testModeBanner')}</p>
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === 'invoices' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <BadgeEuro className="w-4 h-4" />{t('invoicing.tabInvoices')}
        </button>
        <button
          onClick={() => setTab('clients')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === 'clients' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users className="w-4 h-4" />{t('invoicing.tabClients')}
        </button>
        {canManageCertificate && (
          <button
            onClick={() => setTab('numbering')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === 'numbering' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Hash className="w-4 h-4" />{t('invoicing.tabNumbering')}
          </button>
        )}
        {canManageCertificate && (
          <button
            onClick={() => setTab('certificate')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === 'certificate' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck className="w-4 h-4" />{t('invoicing.tabCertificate')}
          </button>
        )}
      </div>

      {tab === 'certificate' && <CertificateTab />}

      {tab === 'clients' && <BillingClientsList onViewInvoices={handleViewClientInvoices} />}

      {tab === 'numbering' && <InvoiceSeriesConfig />}

      {tab === 'invoices' && (
      <>
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
          <PatientCombobox
            patients={patients}
            value={filters.patient_id}
            onChange={id => setFilters(f => ({ ...f, patient_id: id }))}
            placeholder={t('invoicing.all')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('invoicing.recipientType')}</label>
          <select value={filters.recipient_type} onChange={e => setFilters(f => ({ ...f, recipient_type: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">{t('invoicing.all')}</option>
            <option value="paciente">{t('invoicing.recipientTypePaciente')}</option>
            <option value="cliente">{t('invoicing.recipientTypeCliente')}</option>
            <option value="manual">{t('invoicing.recipientTypeManual')}</option>
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
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('invoicing.paymentStatus')}</label>
          <select value={filters.payment_status} onChange={e => setFilters(f => ({ ...f, payment_status: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">{t('invoicing.all')}</option>
            <option value="pendiente">{t('invoicing.paymentStatusPendiente')}</option>
            <option value="parcial">{t('invoicing.paymentStatusParcial')}</option>
            <option value="cobrada">{t('invoicing.paymentStatusCobrada')}</option>
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
                  <th className="px-4 py-3 font-semibold">{t('invoicing.colType')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('invoicing.colTotal')}</th>
                  <th className="px-4 py-3 font-semibold">{t('invoicing.colStatus')}</th>
                  <th className="px-4 py-3 font-semibold">{t('invoicing.colPaymentStatus')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{t('invoicing.colAeat')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('invoicing.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {inv.invoice_number}
                      {inv.invoice_kind && inv.invoice_kind !== 'ordinaria' && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 align-middle">
                          {t(`invoicing.invoiceKind${inv.invoice_kind.charAt(0).toUpperCase()}${inv.invoice_kind.slice(1)}`)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(inv.issue_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.recipient_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{recipientTypeLabel(inv.recipient_type ?? 'manual')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmtMoney(inv.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {inv.status === 'anulada' && <Ban className="w-3 h-3" />}
                        {t(`invoicing.status${inv.status.charAt(0).toUpperCase()}${inv.status.slice(1)}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_BADGE[inv.payment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {t(`invoicing.paymentStatus${(inv.payment_status ?? 'pendiente').charAt(0).toUpperCase()}${(inv.payment_status ?? 'pendiente').slice(1)}`)}
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
                        <button onClick={() => openView(inv)} title={t('invoicing.actionView')} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePdfAction(inv, 'download')} title={t('invoicing.actionDownload')} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEmailModal(inv)} title={t('invoicing.actionEmail')} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPayingInvoice(inv)} title={t('invoicing.actionManagePayment')} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                          <Wallet className="w-4 h-4" />
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
      </>
      )}

      {modalOpen && (
        <InvoiceModal
          patients={patients}
          billingClients={billingClients}
          onBillingClientCreated={client => setBillingClients(bcs => [...bcs, client])}
          onPatientCreated={p => setPatients(ps => [...ps, p])}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {viewing && (
        <InvoiceView invoice={viewing} clinic={clinic} onClose={closeView} onCancelled={handleCancelled} />
      )}

      {emailing && (
        <SendInvoiceEmailModal
          invoice={emailing}
          clinic={clinic}
          defaultEmail={defaultEmailFor(emailing)}
          onClose={() => setEmailing(null)}
          onSent={load}
        />
      )}

      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onChanged={load}
        />
      )}
    </div>
  )
}
