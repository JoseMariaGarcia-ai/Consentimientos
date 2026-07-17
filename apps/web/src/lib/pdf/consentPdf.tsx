import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

function stripHtml(html: string): string {
  return (html ?? '')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim()
}

function getContentJson(template: any) {
  return template?.contentJson ?? template?.content_json ?? {}
}

// Las plantillas incluyen dos líneas "☐ Autorizo el uso de mis imágenes..."
// (formativo/científico y publicitario/difusión, ver
// 014_image_session_clause.sql) — se identifican por palabras clave (el
// texto exacto varía algo entre plantillas) para marcarlas con ☑ si el
// paciente autorizó ese uso concreto, o tacharlas si lo denegó.
const IMAGE_AUTH_PHRASE = /autorizo el uso de mis im[aá]genes/i
const IMAGE_AUTH_EDUCATIONAL_KEYWORDS = /(formativ|cient[ií]fic)/i
const IMAGE_AUTH_MARKETING_KEYWORDS = /(publicitario|difusi[oó]n)/i

function isEducationalImageLine(line: string): boolean {
  return IMAGE_AUTH_PHRASE.test(line) && IMAGE_AUTH_EDUCATIONAL_KEYWORDS.test(line)
}

function isMarketingImageLine(line: string): boolean {
  return IMAGE_AUTH_PHRASE.test(line) && IMAGE_AUTH_MARKETING_KEYWORDS.test(line)
}

const C = {
  navy:    '#1A2B4A',
  blue:    '#2563EB',
  slate:   '#475569',
  light:   '#F1F5F9',
  border:  '#CBD5E1',
  muted:   '#94A3B8',
  body:    '#334155',
  green:   '#059669',
  greenBg: '#ECFDF5',
  greenBorder: '#6EE7B7',
}

const styles = StyleSheet.create({
  page: { padding: 44, fontFamily: "Helvetica", fontSize: 10, color: '#0F172A' },

  // Title block
  titleBlock: {
    backgroundColor: C.navy, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  titleMain:    { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  titleClinic:  { fontSize: 9, color: '#94C3F8', marginTop: 3 },
  titleClinicMeta: { fontSize: 7.5, color: '#7FA8DE', marginTop: 2 },
  titleUuid:    { fontSize: 6, color: '#93C5FD', fontFamily: 'Courier', textAlign: 'right' },
  titleDate:    { fontSize: 7, color: '#BFDBFE', textAlign: 'right', marginTop: 2 },

  section: { marginBottom: 14 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.navy,
    marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: C.border, paddingBottom: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row:   { flexDirection: 'row', marginBottom: 2 },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.slate, width: 100 },
  value: { fontSize: 9, color: '#0F172A', flex: 1 },

  bodyText: { fontSize: 9, color: C.body, lineHeight: 1.65 },
  declinedImageAuthLine: { textDecoration: 'line-through', color: C.muted },

  legalBox: { backgroundColor: C.light, borderLeftWidth: 3, borderLeftColor: C.blue, padding: 8, marginBottom: 6 },
  legalText: { fontSize: 8, color: C.slate, lineHeight: 1.5 },

  signaturesRow:  { flexDirection: 'row', gap: 12, marginTop: 10 },
  signatureBox:   { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 3, padding: 8, minHeight: 80, alignItems: 'center' },
  signatureLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.slate, marginBottom: 4, textTransform: 'uppercase' },

  // eIDAS / huella digital block
  eidasBlock: {
    backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenBorder,
    borderRadius: 4, padding: 10, marginTop: 10,
  },
  eidasTitle:  { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.green, marginBottom: 6 },
  eidasRow:    { flexDirection: 'row', marginBottom: 3 },
  eidasLabel:  { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.slate, width: 120 },
  eidasValue:  { fontSize: 7.5, color: C.body, flex: 1 },
  eidasHash:   { fontSize: 6.5, color: C.body, fontFamily: 'Courier', marginTop: 2 },

  qrSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10 },
  qrBox:     { borderWidth: 1, borderColor: C.border, padding: 4 },
  qrCaption: { fontSize: 7, color: C.muted, maxWidth: 170 },

  footer: {
    position: 'absolute', bottom: 16, left: 44, right: 44,
    borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.5, color: C.muted },
})

interface ConsentPdfProps {
  consent: any; patient: any; doctor: any; clinic: any;
  language: string; documentHash: string; consentUuid: string;
  legalData: any; qrDataUrl?: string;
}

export function ConsentPdf({ consent, patient, doctor, clinic, language, documentHash, consentUuid, legalData, qrDataUrl }: ConsentPdfProps) {
  const contentJson = getContentJson(consent.template)
  const content = contentJson[language] ?? contentJson['es-ES'] ?? {}

  const bodyText   = stripHtml(content.body   ?? legalData?.body   ?? '')
  const introText  = stripHtml(legalData?.introText  ?? '')
  const rightsText = stripHtml(legalData?.rightsText ?? '')
  const imageAuthEducational = consent.image_auth_educational ?? consent.imageAuthEducational ?? false
  const imageAuthMarketing   = consent.image_auth_marketing   ?? consent.imageAuthMarketing   ?? false

  const patientName     = patient?.fullName ?? patient?.full_name ?? '—'
  const patientDoc      = patient?.idDocument ?? patient?.id_document ?? ''
  const patientDocType  = patient?.idDocType  ?? patient?.id_doc_type ?? ''
  const doctorName      = doctor?.name ?? '—'
  const doctorLicense   = doctor?.licenseNumber ?? doctor?.license_number ?? ''
  const doctorSpecialty = doctor?.specialty ?? ''

  const sede         = consent.sede ?? null
  const createdDate  = consent.created_at ? new Date(consent.created_at).toLocaleString('es-ES') : ''
  const signedDate   = (consent.signedAt ?? consent.signed_at) ? new Date(consent.signedAt ?? consent.signed_at).toLocaleString('es-ES') : '—'
  const verifyUrl    = `https://www.consentspro.com/verify/${consentUuid}`
  const consentTitle = content.title ?? 'Consentimiento Informado'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Title block ── */}
        <View style={styles.titleBlock}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleMain}>{consentTitle}</Text>
            <Text style={styles.titleClinic}>
              {clinic?.trade_name ?? clinic?.name ?? ''}
              {clinic?.legal_name ? `  ·  Razón social: ${clinic.legal_name}` : ''}
              {sede ? `  ·  Sede: ${sede}` : ''}
            </Text>
            {(clinic?.tax_id || clinic?.address || clinic?.nika_number) && (
              <Text style={styles.titleClinicMeta}>
                {[
                  clinic?.tax_id ? `CIF/NIF: ${clinic.tax_id}` : null,
                  clinic?.address ? `Domicilio: ${clinic.address}` : null,
                  clinic?.nika_number ? `Nº NIKA: ${clinic.nika_number}` : null,
                ].filter(Boolean).join('  ·  ')}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.titleUuid}>UUID: {consentUuid}</Text>
            <Text style={styles.titleDate}>{createdDate}</Text>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partes del consentimiento</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Paciente:</Text>
            <Text style={styles.value}>{patientName}{patientDoc ? `  ·  ${patientDocType} ${patientDoc}` : ''}</Text>
          </View>
          {patient?.phone && <View style={styles.row}><Text style={styles.label}>Teléfono:</Text><Text style={styles.value}>{patient.phone}</Text></View>}
          {patient?.email && <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{patient.email}</Text></View>}
          <View style={styles.row}>
            <Text style={styles.label}>Doctor:</Text>
            <Text style={styles.value}>{doctorName}{doctorSpecialty ? `  ·  ${doctorSpecialty}` : ''}</Text>
          </View>
          {doctorLicense && <View style={styles.row}><Text style={styles.label}>Nº Colegiado:</Text><Text style={styles.value}>{doctorLicense}</Text></View>}
          {sede && <View style={styles.row}><Text style={styles.label}>Sede:</Text><Text style={styles.value}>{sede}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>Fecha de firma:</Text><Text style={styles.value}>{signedDate}</Text></View>
        </View>

        {/* ── Legal framework ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marco Legal — {legalData?.jurisdiction}</Text>
          <View style={styles.legalBox}>
            <Text style={styles.legalText}>{legalData?.applicableLaw}</Text>
          </View>
          {introText ? <Text style={styles.legalText}>{introText}</Text> : null}
        </View>

        {/* ── Consent body ── */}
        {bodyText ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información y consentimiento</Text>
            <Text style={styles.bodyText}>
              {bodyText.split('\n').map((line, i, arr) => {
                const educational = isEducationalImageLine(line)
                const marketing = isMarketingImageLine(line)
                const authorized = (educational && imageAuthEducational) || (marketing && imageAuthMarketing)
                const declined = (educational && !imageAuthEducational) || (marketing && !imageAuthMarketing)
                // Helvetica (la fuente base de react-pdf) no incluye el
                // glifo "☐" — se sustituye por notación ASCII "[X]"/"[ ]"
                // para que la marca de autorizado/denegado sea visible en
                // el PDF generado.
                const displayLine = line.replace('☐', authorized ? '[X]' : '[ ]')
                return (
                  <Text key={i} style={declined ? styles.declinedImageAuthLine : undefined}>
                    {displayLine}{i < arr.length - 1 ? '\n' : ''}
                  </Text>
                )
              })}
            </Text>
          </View>
        ) : null}

        {/* ── Patient rights ── */}
        {rightsText ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Derechos del paciente</Text>
            <Text style={styles.legalText}>{rightsText}</Text>
          </View>
        ) : null}

        {/* ── Signatures ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firmas</Text>
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Firma del doctor</Text>
              {consent.doctor_signature_data_url
                ? <Image src={consent.doctor_signature_data_url} style={{ height: 50 }} />
                : <Text style={{ fontSize: 8, color: C.border, marginTop: 14 }}>Sin firma</Text>}
              <Text style={{ fontSize: 7, color: C.slate, marginTop: 4 }}>{doctorName}</Text>
              {doctorLicense ? <Text style={{ fontSize: 6, color: C.muted }}>Nº Col. {doctorLicense}</Text> : null}
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Firma del paciente</Text>
              {(consent.signatureDataUrl ?? consent.signature_data_url)
                ? <Image src={consent.signatureDataUrl ?? consent.signature_data_url} style={{ height: 50 }} />
                : <Text style={{ fontSize: 8, color: C.border, marginTop: 14 }}>Sin firma</Text>}
              <Text style={{ fontSize: 7, color: C.slate, marginTop: 4 }}>{patientName}</Text>
              <Text style={{ fontSize: 6, color: C.muted }}>{signedDate}</Text>
            </View>
          </View>
        </View>

        {/* ── eIDAS + Huella digital ── */}
        <View style={styles.eidasBlock}>
          <Text style={styles.eidasTitle}>✓  Firma Electrónica Avanzada — Reglamento eIDAS (UE) 910/2014</Text>
          <View style={styles.eidasRow}>
            <Text style={styles.eidasLabel}>Normativa aplicable:</Text>
            <Text style={styles.eidasValue}>Reglamento (UE) 910/2014 (eIDAS) — Art. 26 Firma Electrónica Avanzada</Text>
          </View>
          <View style={styles.eidasRow}>
            <Text style={styles.eidasLabel}>Protección de datos:</Text>
            <Text style={styles.eidasValue}>RGPD (UE) 2016/679 · Ley Orgánica 3/2018 (LOPDGDD)</Text>
          </View>
          <View style={styles.eidasRow}>
            <Text style={styles.eidasLabel}>Ley de autonomía:</Text>
            <Text style={styles.eidasValue}>Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente</Text>
          </View>
          <View style={styles.eidasRow}>
            <Text style={styles.eidasLabel}>Timestamp servidor:</Text>
            <Text style={styles.eidasValue}>{signedDate}</Text>
          </View>
          <View style={styles.eidasRow}>
            <Text style={styles.eidasLabel}>UUID documento:</Text>
            <Text style={{ ...styles.eidasValue, fontFamily: 'Courier', fontSize: 7 }}>{consentUuid}</Text>
          </View>
          {documentHash && <>
            <Text style={{ ...styles.eidasLabel, marginTop: 4 }}>Huella digital SHA-256:</Text>
            <Text style={styles.eidasHash}>{documentHash}</Text>
          </>}
        </View>

        {/* ── QR + verify ── */}
        {qrDataUrl && (
          <View style={styles.qrSection}>
            <Text style={styles.qrCaption}>
              Escanea el código QR para verificar la autenticidad e integridad de este documento.{'\n'}
              El sistema validará la firma electrónica y el hash SHA-256.{'\n\n'}
              {verifyUrl}
            </Text>
            <View style={styles.qrBox}>
              <Image src={qrDataUrl} style={{ width: 80, height: 80 }} />
            </View>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ConsentsPro · Firma Electrónica Avanzada · eIDAS (UE) 910/2014</Text>
          <Text style={styles.footerText}>{legalData?.footerLegal ?? ''}</Text>
        </View>

      </Page>
    </Document>
  )
}
