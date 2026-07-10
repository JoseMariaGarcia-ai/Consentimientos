import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeEuro, X, Ban, CheckCircle2, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { InvoicePdfButton } from './InvoicePdfButton'

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

export function InvoiceView({ invoice, clinic, onClose, onCancelled }: Props) {
  const { t } = useTranslation()
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  const lastAlta = (invoice.records ?? []).slice().reverse().find((r: any) => r.record_type === 'alta')
  const aeatPending = !lastAlta?.aeat_sent_at

  const handleCancel = async () => {
    if (!confirm(t('invoiceView.confirmCancel'))) return
    setError('')
    setCancelling(true)
    try {
      await api.post(`/invoices/${invoice.id}/cancel`, {})
      onCancelled()
    } catch (err: any) {
      setError(err.message ?? t('invoiceView.cancelFailed'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <BadgeEuro className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">{invoice.invoice_number}</h2>
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
              <span className="text-lg font-bold text-emerald-700">{fmtMoney(invoice.total_amount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {aeatPending ? (
              <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 rounded-full px-2.5 py-1 font-medium">
                <Clock className="w-3.5 h-3.5" />{t('invoiceView.aeatPending')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />{t('invoiceView.aeatSent')}
              </span>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <InvoicePdfButton invoice={invoice} clinic={clinic} />
          {invoice.status !== 'anulada' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-xl disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              {cancelling ? t('invoiceView.cancelling') : t('invoiceView.cancelInvoice')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
