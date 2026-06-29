import { useState, useEffect } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import { ConsentPdf } from '@/lib/pdf/consentPdf'
import { LEGAL_FRAMEWORKS } from '@/i18n/legalTexts'

interface Props {
  consent: any
  clinic: any
}

export function ConsentPdfButton({ consent, clinic }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>()

  const lang = consent.language ?? 'es-ES'

  // row_to_json returns snake_case; support both forms
  const template = consent.template ?? {}
  const contentJson = template.contentJson ?? template.content_json ?? {}
  const legalClausesJson = template.legalClausesJson ?? template.legal_clauses_json ?? {}

  const content = contentJson[lang] ?? contentJson['es-ES'] ?? {}
  const legalClauses = legalClausesJson[lang] ?? legalClausesJson['es-ES'] ?? {}
  const framework = LEGAL_FRAMEWORKS[lang] ?? LEGAL_FRAMEWORKS['es-ES']

  const consentUuid = consent.consent_uuid ?? consent.consentUuid ?? consent.id
  const verifyUrl = `https://consentimientos-production.up.railway.app/verify/${consentUuid}`

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, { width: 200, margin: 1, color: { dark: '#1A2B4A', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => {})
  }, [verifyUrl])

  const patient = consent.patient
    ? { ...consent.patient, fullName: consent.patient.full_name ?? consent.patient.fullName }
    : null

  const legalData = {
    title:         content.title ?? '',
    body:          content.body  ?? '',
    jurisdiction:  legalClauses.jurisdiction  ?? framework.jurisdiction,
    applicableLaw: legalClauses.applicableLaw ?? framework.law,
    introText:     legalClauses.introText     ?? framework.consentIntroText,
    rightsText:    legalClauses.rightsText    ?? framework.withdrawalRights,
    footerLegal:   legalClauses.footerLegal   ?? framework.signatureValidity,
    witnessRequired: legalClauses.witnessRequired ?? framework.witnessRequired,
  }

  const filename = `consentimiento_${(patient?.fullName ?? 'paciente').replace(/\s+/g, '_')}_${consentUuid}.pdf`

  if (!qrDataUrl) {
    return (
      <button disabled className="p-1.5 text-slate-300 rounded-lg" title="Generando PDF…">
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
          title="Exportar PDF"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        </button>
      )}
    </PDFDownloadLink>
  )
}
