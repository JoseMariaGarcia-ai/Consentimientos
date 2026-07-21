import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { LEGAL_FRAMEWORKS } from '@/i18n/legalTexts'
import { ConsentPdf } from '@/lib/pdf/consentPdf'
import { getToken } from '@/lib/auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(((reader.result as string) ?? '').split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Genera el PDF del consentimiento ya firmado y lo sube al servidor para
// guardarlo (ver POST /api/pdf/upload) — el aviso por email ya lo manda el
// propio endpoint de firma en cuanto se guarda la firma (routes/signature.ts
// y routes/signingKiosk.ts), así que aquí se pide skipEmail para no duplicar
// el correo; esta subida solo deja el PDF real guardado para consultarlo
// más adelante. Es un "mejor esfuerzo": si falla, el consentimiento ya
// quedó firmado y el paciente ya fue avisado igualmente.
export async function generateAndEmailConsentPdf(consentId: string, authToken?: string) {
  const token = authToken ?? getToken()
  if (!token) return
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  try {
    const [consentRes, clinicRes] = await Promise.all([
      fetch(`${BASE_URL}/consents/${consentId}`, { headers }),
      fetch(`${BASE_URL}/clinic`, { headers }),
    ])
    if (!consentRes.ok) throw new Error('No se pudo cargar el consentimiento')
    const consent = await consentRes.json()
    const clinic = clinicRes.ok ? await clinicRes.json() : null

    const lang = consent.language ?? 'es-ES'
    const template = consent.template ?? {}
    const contentJson = template.contentJson ?? template.content_json ?? {}
    const legalClausesJson = template.legalClausesJson ?? template.legal_clauses_json ?? {}
    const content = contentJson[lang] ?? contentJson['es-ES'] ?? {}
    const legalClauses = legalClausesJson[lang] ?? legalClausesJson['es-ES'] ?? {}
    const framework = LEGAL_FRAMEWORKS[lang] ?? LEGAL_FRAMEWORKS['es-ES']
    const consentUuid = consent.consent_uuid ?? consent.consentUuid ?? consent.id
    const verifyUrl = `https://www.consentspro.com/verify/${consentUuid}`
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1, color: { dark: '#1A2B4A', light: '#ffffff' } })
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

    const doc = (
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
    )
    const blob = await pdf(doc).toBlob()
    const pdfBase64 = await blobToBase64(blob)
    await fetch(`${BASE_URL}/pdf/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ consentId, pdfBase64, skipEmail: true }),
    })
  } catch (err) {
    console.error('[consentPdfUpload] no se pudo generar/enviar el PDF del consentimiento:', err)
  }
}
