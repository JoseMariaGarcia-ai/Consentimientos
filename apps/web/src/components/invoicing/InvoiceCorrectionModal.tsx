import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileEdit, X } from 'lucide-react'

interface Props {
  kind: 'rectificativa' | 'abono'
  invoiceNumber: string
  originalTotal: number
  onConfirm: (data: { reason: string; amount?: number; full?: boolean }) => Promise<void>
  onClose: () => void
}

function fmtMoney(n: number) {
  return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export function InvoiceCorrectionModal({ kind, invoiceNumber, originalTotal, onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')
  const [full, setFull] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isAbono = kind === 'abono'

  const handleConfirm = async () => {
    setError('')
    if (!reason.trim()) { setError(t('invoiceCorrectionModal.errors.reasonRequired')); return }
    if (isAbono && full) {
      setSaving(true)
      try {
        await onConfirm({ reason: reason.trim(), full: true })
        onClose()
      } catch (err: any) {
        setError(err.message ?? t('invoiceCorrectionModal.errors.saveFailed'))
      } finally {
        setSaving(false)
      }
      return
    }
    const amt = Number(amount)
    if (isAbono ? !(amt > 0) : (!amt || amt === 0)) {
      setError(t(isAbono ? 'invoiceCorrectionModal.errors.amountPositive' : 'invoiceCorrectionModal.errors.amountNonZero'))
      return
    }
    setSaving(true)
    try {
      await onConfirm({ reason: reason.trim(), amount: amt })
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('invoiceCorrectionModal.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <FileEdit className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {t(isAbono ? 'invoiceCorrectionModal.titleAbono' : 'invoiceCorrectionModal.titleRectificativa')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            {t(isAbono ? 'invoiceCorrectionModal.descriptionAbono' : 'invoiceCorrectionModal.descriptionRectificativa', { number: invoiceNumber })}
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              {t('invoiceCorrectionModal.reasonLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {isAbono && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={full} onChange={e => setFull(e.target.checked)} className="rounded border-slate-300" />
              {t('invoiceCorrectionModal.fullRefund', { total: fmtMoney(originalTotal) })}
            </label>
          )}

          {!(isAbono && full) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                {t(isAbono ? 'invoiceCorrectionModal.amountLabelAbono' : 'invoiceCorrectionModal.amountLabelRectificativa')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2 pr-7 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
              </div>
              {!isAbono && <p className="text-[11px] text-slate-400">{t('invoiceCorrectionModal.amountHintRectificativa')}</p>}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('invoiceCorrectionModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
