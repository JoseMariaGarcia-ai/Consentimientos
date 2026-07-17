import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConsentPdf } from '@/lib/pdf/consentPdf'
import { useConsentPdfDocument } from '@/lib/useConsentPdfDocument'

interface Props {
  consent: any
  clinic: any
}

export function ConsentPdfButton({ consent, clinic }: Props) {
  const { t } = useTranslation()
  const { ready, qrDataUrl, lang, patient, legalData, consentUuid, filename } = useConsentPdfDocument(consent, clinic)

  if (!ready) {
    return (
      <button disabled className="p-1.5 text-slate-300 rounded-lg" title={t('consentPdfButton.generating')}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    )
  }

  return (
    <PDFDownloadLink
      document={
        <ConsentPdf
          consent={consent}
          patient={patient}
          doctor={consent.doctor}
          clinic={clinic}
          language={lang}
          documentHash={consent.document_hash ?? consent.documentHash ?? ''}
          consentUuid={consentUuid}
          legalData={legalData}
          qrDataUrl={qrDataUrl}
        />
      }
      fileName={filename}
    >
      {({ loading }) => (
        <button
          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 disabled:opacity-40"
          title={t('consentPdfButton.export')}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        </button>
      )}
    </PDFDownloadLink>
  )
}
