import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, X } from 'lucide-react'

interface Props {
  patientName: string
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}

export function RevokeConsentModal({ patientName, onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setError('')
    if (!reason.trim()) { setError(t('revokeConsentModal.errors.reasonRequired')); return }
    setSaving(true)
    try {
      await onConfirm(reason.trim())
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('revokeConsentModal.errors.revokeFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Ban className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-800">{t('revokeConsentModal.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <p className="text-sm text-slate-600">{t('revokeConsentModal.description', { name: patientName })}</p>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {t('revokeConsentModal.notice')}
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              {t('revokeConsentModal.reasonLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? t('revokeConsentModal.revoking') : t('revokeConsentModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
