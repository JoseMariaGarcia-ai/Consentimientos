import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { LEGAL_FRAMEWORKS } from '@/i18n/legalTexts'

// Extraído de ConsentPdfButton para reutilizar la misma preparación de datos
// (QR, textos legales, paciente) tanto al descargar el PDF como al
// visualizarlo en pantalla sin descargar.
export function useConsentPdfDocument(consent: any, clinic: any) {
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>()

  const lang = consent.language ?? 'es-ES'
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

  return {
    ready: !!qrDataUrl,
    qrDataUrl,
    lang,
    patient,
    legalData,
    consentUuid,
    filename,
  }
}
