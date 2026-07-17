import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { useTranslation } from 'react-i18next'
import { X, FileDown, Loader2 } from 'lucide-react'
import { ConsentPdf } from '@/lib/pdf/consentPdf'
import { useConsentPdfDocument } from '@/lib/useConsentPdfDocument'

interface Props {
  consent: any
  clinic: any
  onClose: () => void
}

export function ConsentViewModal({ consent, clinic, onClose }: Props) {
  const { t } = useTranslation()
  const { ready, qrDataUrl, lang, patient, legalData, consentUuid, filename } = useConsentPdfDocument(consent, clinic)

  const doc = ready ? (
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
  ) : null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm truncate">
            {consent.template?.treatmentType ?? consent.template?.treatment_type ?? t('consentViewModal.title')}
          </h2>
          <div className="flex items-center gap-1">
            {doc && (
              <PDFDownloadLink document={doc} fileName={filename}>
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
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100">
          {doc ? (
            <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none' }}>
              {doc}
            </PDFViewer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
