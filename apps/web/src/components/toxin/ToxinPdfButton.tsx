import { PDFDownloadLink } from '@react-pdf/renderer'
import { useTranslation } from 'react-i18next'
import { FileDown } from 'lucide-react'
import { ToxinPdf } from '@/lib/pdf/toxinPdf'

interface Props {
  clinic: any
  records: any[]
  filters: { date_from?: string; date_to?: string; doctor_name?: string; patient_name?: string; lot_number?: string }
}

export function ToxinPdfButton({ clinic, records, filters }: Props) {
  const { t } = useTranslation()
  const filename = `control_toxina_${new Date().toISOString().slice(0, 10)}.pdf`

  return (
    <PDFDownloadLink
      document={<ToxinPdf clinic={clinic} records={records} filters={filters} />}
      fileName={filename}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          {loading ? t('toxinPdfButton.generating') : t('toxinPdfButton.export_pdf')}
        </button>
      )}
    </PDFDownloadLink>
  )
}
