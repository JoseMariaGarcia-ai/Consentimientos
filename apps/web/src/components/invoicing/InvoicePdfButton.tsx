import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { FileDown, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InvoicePdf } from '@/lib/pdf/invoicePdf'

interface Props {
  invoice: any
  clinic: any
}

async function qrDataUrlFor(invoice: any): Promise<string | null> {
  const lastAlta = (invoice.records ?? []).slice().reverse().find((r: any) => r.record_type === 'alta')
  if (!lastAlta?.qr_content) return null
  try {
    return await QRCode.toDataURL(lastAlta.qr_content, { margin: 1, width: 300 })
  } catch {
    return null
  }
}

export async function invoicePdfBlob(invoice: any, clinic: any) {
  const qrDataUrl = await qrDataUrlFor(invoice)
  return pdf(<InvoicePdf clinic={clinic} invoice={invoice} qrDataUrl={qrDataUrl} />).toBlob()
}

export function InvoicePdfButton({ invoice, clinic }: Props) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const blob = await invoicePdfBlob(invoice, clinic)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura_${invoice.invoice_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {t('invoiceView.downloadPdf')}
    </button>
  )
}
