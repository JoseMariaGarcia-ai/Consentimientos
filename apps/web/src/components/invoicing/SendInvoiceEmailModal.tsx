import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, X } from 'lucide-react'
import { api } from '@/lib/api'
import { invoicePdfBlob } from './InvoicePdfButton'

interface Props {
  invoice: any
  clinic: any
  defaultEmail: string
  onClose: () => void
  onSent: () => void
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function SendInvoiceEmailModal({ invoice, clinic, defaultEmail, onClose, onSent }: Props) {
  const { t } = useTranslation()
  const [email, setEmail] = useState(defaultEmail)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    setError('')
    if (!email.trim()) { setError(t('sendInvoiceEmailModal.errors.emailRequired')); return }
    setSending(true)
    try {
      const blob = await invoicePdfBlob(invoice, clinic)
      const pdfBase64 = await blobToBase64(blob)
      await api.post(`/invoices/${invoice.id}/send-email`, { pdfBase64, email: email.trim() })
      onSent()
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('sendInvoiceEmailModal.errors.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">{t('sendInvoiceEmailModal.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            {t('sendInvoiceEmailModal.description', { number: invoice.invoice_number })}
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('sendInvoiceEmailModal.emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400">{t('sendInvoiceEmailModal.emailHint')}</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {sending ? t('sendInvoiceEmailModal.sending') : t('sendInvoiceEmailModal.send')}
          </button>
        </div>
      </div>
    </div>
  )
}
