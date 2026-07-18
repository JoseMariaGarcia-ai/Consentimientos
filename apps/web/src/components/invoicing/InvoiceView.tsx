import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeEuro, X, Ban, CheckCircle2, Clock, FileEdit, Wallet, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { InvoicePdfButton } from './InvoicePdfButton'
import { CancelInvoiceModal } from './CancelInvoiceModal'
import { InvoiceCorrectionModal } from './InvoiceCorrectionModal'
import { PaymentModal } from './PaymentModal'

interface Props {
  invoice: any
  clinic: any
  onClose: () => void
  onCancelled: () => void
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}
function fmtMoney(n: number) {
  return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const PAYMENT_BADGE: Record<string, string> = {
  pendiente: 'bg-red-50 text-red-600',
  parcial: 'bg-amber-50 text-amber-700',
  cobrada: 'bg-emerald-50 text-emerald-700',
}

export function InvoiceView({ invoice: initialInvoice, clinic, onClose, onCancelled }: Props) {
  const { t } = useTranslation()
  const [invoice, setInvoice] = useState(initialInvoice)
  const [cancelModal, setCancelModal] = useState(false)
  const [correctionModal, setCorrectionModal] = useState<'rectificativa' | 'abono' | null>(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [corrections, setCorrections] = useState<any[]>([])
  const [error, setError] = useState('')

  const lastAlta = (invoice.records ?? []).slice().reverse().find((r: any) => r.record_type === 'alta')
  const aeatPending = !lastAlta?.aeat_sent_at
  const canCorrect = invoice.status === 'emitida'

  useEffect(() => {
    api.get(`/invoices/${invoice.id}/corrections`).then((data: any) => setCorrections(Array.isArray(data) ? data : [])).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice.id])

  const refreshInvoice = async () => {
    const full = await api.get(`/invoices/${invoice.id}`)
    setInvoice(full)
  }

  const handleCancel = async (reason: string) => {
    await api.post(`/invoices/${invoice.id}/cancel`, { reason })
    onCancelled()
  }

  const handleCorrection = async (kind: 'rectificativa' | 'abono', data: { reason: string; amount?: number; full?: boolean }) => {
    const endpoint = kind === 'abono' ? 'abonar' : 'rectificar'
    try {
      await api.post(`/invoices/${invoice.id}/${endpoint}`, data)
      onCancelled() // reutiliza el mismo refresco de listado que la anulación
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <BadgeEuro className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {invoice.invoice_number}
                {invoice.invoice_kind !== 'ordinaria' && (
                  <span className="ml-2 align-middle inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700">
                    {t(`invoicing.invoiceKind${invoice.invoice_kind.charAt(0).toUpperCase()}${invoice.invoice_kind.slice(1)}`)}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">{fmtDate(invoice.issue_date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {invoice.status === 'anulada' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs font-medium text-red-700">
              <Ban className="w-4 h-4 flex-shrink-0" />
              {t('invoiceView.cancelledNotice')}
            </div>
          )}
          {invoice.status === 'rectificada' && (
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 text-xs font-medium text-violet-700">
              <FileEdit className="w-4 h-4 flex-shrink-0" />
              {t('invoiceView.rectifiedNotice')}
            </div>
          )}

          {corrections.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('invoiceView.correctionsTitle')}</span>
              {corrections.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  <span className="flex-1">
                    {t(`invoiceView.correctionType.${c.correction_type}`)}
                    {c.correction_invoice ? ` → ${c.correction_invoice.invoice_number}` : ''}
                    {' — '}{c.reason}
                  </span>
                </div>
              ))}
            </div>
          )}

          {invoice.rectifies_invoice_id && (
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              {t('invoiceView.rectifiesReference')}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('invoiceView.recipient')}</span>
            <span className="text-sm font-semibold text-slate-800">{invoice.recipient_name}</span>
            <span className="text-xs text-slate-500">{invoice.recipient_nif}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('invoiceView.concept')}</span>
            <span className="text-sm text-slate-700">{invoice.concept}</span>
          </div>

          <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{t('invoiceModal.form.base')}</span>
              <span>{fmtMoney(invoice.base_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{t('invoiceModal.form.vat', { rate: Number(invoice.vat_rate) })}</span>
              <span>{fmtMoney(invoice.vat_amount)}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-800 uppercase tracking-wide">{t('invoiceModal.form.total')}</span>
              <span className={`text-lg font-bold ${Number(invoice.total_amount) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{fmtMoney(invoice.total_amount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            {aeatPending ? (
              <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 rounded-full px-2.5 py-1 font-medium">
                <Clock className="w-3.5 h-3.5" />{t('invoiceView.aeatPending')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />{t('invoiceView.aeatSent')}
              </span>
            )}
            <button
              onClick={() => setPaymentModal(true)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium hover:opacity-80 ${PAYMENT_BADGE[invoice.payment_status] ?? 'bg-slate-100 text-slate-600'}`}
            >
              <Wallet className="w-3.5 h-3.5" />{t(`invoicing.paymentStatus${(invoice.payment_status ?? 'pendiente').charAt(0).toUpperCase()}${(invoice.payment_status ?? 'pendiente').slice(1)}`)}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 px-6 py-4 border-t border-slate-100">
          <InvoicePdfButton invoice={invoice} clinic={clinic} />
          {canCorrect && (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setCorrectionModal('rectificativa')}
                className="flex items-center gap-1.5 px-3 py-2 text-emerald-700 text-xs font-medium hover:bg-emerald-50 rounded-xl"
              >
                <FileEdit className="w-3.5 h-3.5" />{t('invoiceView.createRectificativa')}
              </button>
              <button
                onClick={() => setCorrectionModal('abono')}
                className="flex items-center gap-1.5 px-3 py-2 text-emerald-700 text-xs font-medium hover:bg-emerald-50 rounded-xl"
              >
                <FileEdit className="w-3.5 h-3.5" />{t('invoiceView.createAbono')}
              </button>
              <button
                onClick={() => setCancelModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-red-600 text-xs font-medium hover:bg-red-50 rounded-xl"
              >
                <Ban className="w-3.5 h-3.5" />{t('invoiceView.cancelInvoice')}
              </button>
            </div>
          )}
        </div>
      </div>

      {cancelModal && (
        <CancelInvoiceModal
          invoiceNumber={invoice.invoice_number}
          onConfirm={handleCancel}
          onClose={() => setCancelModal(false)}
        />
      )}

      {correctionModal && (
        <InvoiceCorrectionModal
          kind={correctionModal}
          invoiceNumber={invoice.invoice_number}
          originalTotal={Number(invoice.total_amount)}
          onConfirm={data => handleCorrection(correctionModal, data)}
          onClose={() => setCorrectionModal(null)}
        />
      )}

      {paymentModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setPaymentModal(false)}
          onChanged={refreshInvoice}
        />
      )}
    </div>
  )
}
