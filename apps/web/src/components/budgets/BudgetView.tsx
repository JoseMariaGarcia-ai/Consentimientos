import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, X, Mail, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { BudgetPdfButton, budgetPdfBlobBase64 } from './BudgetPdfButton'

interface Props {
  budget: any
  clinic: any
  onClose: () => void
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}
function fmtMoney(n: number) {
  return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export function BudgetView({ budget, clinic, onClose }: Props) {
  const { t } = useTranslation()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const patientName = budget.patient?.full_name ?? budget.patient?.fullName ?? '—'
  const total = (budget.items ?? []).reduce((sum: number, it: any) => sum + (Number(it.price) || 0), 0)

  const handleSendEmail = async () => {
    setError('')
    if (!budget.patient?.email) {
      setError(t('budgetView.no_email'))
      return
    }
    setSending(true)
    try {
      const pdfBase64 = await budgetPdfBlobBase64(budget, clinic)
      await api.post(`/budgets/${budget.id}/send-email`, { pdfBase64 })
      setSent(true)
    } catch (err: any) {
      setError(err.message ?? t('budgetView.send_failed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">{budget.budget_number}</h2>
              <p className="text-xs text-slate-400">{fmtDate(budget.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('budgetView.patient')}</span>
            <span className="text-sm font-semibold text-slate-800">{patientName}</span>
            {budget.patient?.email && <span className="text-xs text-slate-500">{budget.patient.email}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('budgetView.treatments')}</span>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {(budget.items ?? []).map((it: any, i: number) => (
                <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i % 2 === 1 ? 'bg-slate-50' : ''}`}>
                  <span className="text-slate-700">{it.treatment_name}</span>
                  <span className="font-medium text-slate-800">{fmtMoney(it.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-white uppercase tracking-wide">{t('budgetModal.form.total')}</span>
            <span className="text-lg font-bold text-amber-400">{fmtMoney(total)}</span>
          </div>

          {budget.valid_until && (
            <p className="text-xs text-slate-500">{t('budgetView.valid_until', { date: fmtDate(budget.valid_until) })}</p>
          )}
          {budget.notes && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">{budget.notes}</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <BudgetPdfButton budget={budget} clinic={clinic} variant="button" />
          <button
            onClick={handleSendEmail}
            disabled={sending || sent}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {sent ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            {sent ? t('budgetView.sent') : sending ? t('budgetView.sending') : t('budgetView.send_email')}
          </button>
        </div>
      </div>
    </div>
  )
}
