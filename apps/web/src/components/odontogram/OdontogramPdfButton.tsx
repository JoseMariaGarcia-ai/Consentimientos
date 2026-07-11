import { PDFDownloadLink } from '@react-pdf/renderer'
import { useTranslation } from 'react-i18next'
import { FileDown } from 'lucide-react'
import type { OdontogramRecord } from '@consentspro/shared-types'
import { OdontogramPdf } from '@/lib/pdf/odontogramPdf'

interface Props {
  clinic: any
  patient: any
  record: OdontogramRecord
}

export function OdontogramPdfButton({ clinic, patient, record }: Props) {
  const { t } = useTranslation()
  const filename = `odontograma_${(patient?.full_name ?? patient?.fullName ?? 'paciente').replace(/\s+/g, '_')}_${record.record_date.slice(0, 10)}.pdf`

  return (
    <PDFDownloadLink document={<OdontogramPdf clinic={clinic} patient={patient} record={record} />} fileName={filename}>
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <FileDown className="w-3.5 h-3.5" />
          {loading ? t('odontogram.pdf.generating') : t('odontogram.pdf.export')}
        </button>
      )}
    </PDFDownloadLink>
  )
}
