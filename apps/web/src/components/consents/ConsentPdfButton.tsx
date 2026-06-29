import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown } from 'lucide-react'
import { ConsentPdf } from '@/lib/pdf/consentPdf'
import { LEGAL_FRAMEWORKS } from '@/i18n/legalTexts'

interface Props {
  consent: any
  clinic: any
}

export function ConsentPdfButton({ consent, clinic }: Props) {
  const lang = consent.language ?? 'es-ES'
  const template = consent.template ?? { contentJson: {}, legalClausesJson: {} }
  const content = template.contentJson?.[lang] ?? template.contentJson?.['es-ES'] ?? {}
  const legalClauses = template.legalClausesJson?.[lang] ?? template.legalClausesJson?.['es-ES'] ?? {}
  const framework = LEGAL_FRAMEWORKS[lang] ?? LEGAL_FRAMEWORKS['es-ES']

  const patient = consent.patient
    ? { ...consent.patient, fullName: consent.patient.full_name ?? consent.patient.fullName }
    : null

  const legalData = {
    title: content.title ?? '',
    body: content.body ?? '',
    jurisdiction: legalClauses.jurisdiction ?? framework.jurisdiction,
    applicableLaw: legalClauses.applicableLaw ?? framework.law,
    introText: legalClauses.introText ?? framework.consentIntroText,
    rightsText: legalClauses.rightsText ?? framework.withdrawalRights,
    footerLegal: legalClauses.footerLegal ?? framework.signatureValidity,
    witnessRequired: legalClauses.witnessRequired ?? framework.witnessRequired,
  }

  const filename = `consentimiento_${patient?.fullName?.replace(/\s+/g, '_') ?? 'paciente'}_${consent.consent_uuid ?? consent.consentUuid ?? consent.id}.pdf`

  return (
    <PDFDownloadLink
      document={
        <ConsentPdf
          consent={{
            ...consent,
            signatureDataUrl: consent.signature_data_url ?? consent.signatureDataUrl,
            signedAt: consent.signed_at ?? consent.signedAt,
          }}
          patient={patient}
          doctor={consent.doctor}
          clinic={clinic}
          language={lang}
          documentHash={consent.document_hash ?? consent.documentHash ?? ''}
          consentUuid={consent.consent_uuid ?? consent.consentUuid ?? consent.id}
          legalData={legalData}
        />
      }
      fileName={filename}
    >
      {({ loading }) => (
        <button
          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 disabled:opacity-40"
          title="Exportar PDF"
          disabled={loading}
        >
          <FileDown className="w-4 h-4" />
        </button>
      )}
    </PDFDownloadLink>
  )
}
