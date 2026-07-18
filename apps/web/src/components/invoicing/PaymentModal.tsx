import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet, X, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'

interface Props {
  invoice: any
  onClose: () => void
  onChanged: () => void
}

const PAYMENT_METHODS = ['efectivo', 'transferencia', 'bizum', 'tarjeta', 'stripe', 'otro']

function fmtMoney(n: number) {
  return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}
function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function PaymentModal({ invoice, onClose, onChanged }: Props) {
  const { t } = useTranslation()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('transferencia')
  const [date, setDate] = useState(todayIso())
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = Number(invoice.total_amount) || 0

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get(`/invoices/${invoice.id}/payments`)
      setPayments(Array.isArray(data) ? data : [])
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [invoice.id])

  useEffect(() => { load() }, [load])

  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const pending = Math.max(total - paid, 0)

  useEffect(() => {
    if (!loading) setAmount(pending > 0 ? pending.toFixed(2) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, payments.length])

  const handleRegister = async () => {
    setError('')
    const amt = Number(amount)
    if (!(amt > 0)) { setError(t('paymentModal.errors.amountRequired')); return }
    setSaving(true)
    try {
      await api.post(`/invoices/${invoice.id}/payments`, { amount: amt, payment_method: method, payment_date: date, notes: notes.trim() || null })
      setNotes('')
      await load()
      onChanged()
    } catch (err: any) {
      setError(err.message ?? t('paymentModal.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (paymentId: string) => {
    if (!confirm(t('paymentModal.confirmDeletePayment'))) return
    try {
      await api.delete(`/invoices/${invoice.id}/payments/${paymentId}`)
      await load()
      onChanged()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">{t('paymentModal.title', { number: invoice.invoice_number })}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{t('paymentModal.total')}</p>
              <p className="text-sm font-bold text-slate-800">{fmtMoney(total)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{t('paymentModal.paid')}</p>
              <p className="text-sm font-bold text-emerald-700">{fmtMoney(paid)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{t('paymentModal.pending')}</p>
              <p className="text-sm font-bold text-amber-700">{fmtMoney(pending)}</p>
            </div>
          </div>
          {paid > total && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{t('paymentModal.overpaidNotice')}</p>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('paymentModal.registerPayment')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('paymentModal.amount')}</label>
                <div className="relative">
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full px-3 py-2 pr-7 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('paymentModal.method')}</label>
                <select value={method} onChange={e => setMethod(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{t(`paymentModal.methods.${m}`)}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('paymentModal.date')}</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('paymentModal.notes')}</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleRegister}
              disabled={saving}
              className="self-start px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('paymentModal.registerButton')}
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('paymentModal.history')}</p>
            {loading ? (
              <p className="text-sm text-slate-400">{t('common.loading')}</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-slate-400">{t('paymentModal.noPayments')}</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-50">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{fmtMoney(p.amount)} · {t(`paymentModal.methods.${p.payment_method}`)}</p>
                      <p className="text-xs text-slate-400">{fmtDate(p.payment_date)}{p.notes ? ` · ${p.notes}` : ''}</p>
                    </div>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
