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

// Handle both camelCase and snake_case keys returned by row_to_json
function getContentJson(template: any) {
  return template?.contentJson ?? template?.content_json ?? {}
}
function getLegalClausesJson(template: any) {
  return template?.legalClausesJson ?? template?.legal_clauses_json ?? {}
}

const styles = StyleSheet.create({
  page: { padding: 44, fontFamily: "Helvetica", fontSize: 10, color: "#0F172A" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    borderBottomWidth: 2, borderBottomColor: "#1A2B4A", paddingBottom: 12, marginBottom: 18,
  },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#1A2B4A" },
  subtitle: { fontSize: 9, color: "#64748B", marginTop: 2 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold", fontSize: 9, color: "#1A2B4A",
    marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: "#CBD5E1", paddingBottom: 2,
  },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#475569", width: 100 },
  value: { fontSize: 9, color: "#0F172A", flex: 1 },
  bodyText: { fontSize: 9, color: "#334155", lineHeight: 1.65 },
  legalBox: { backgroundColor: "#F1F5F9", borderLeftWidth: 3, borderLeftColor: "#2563EB", padding: 8, marginBottom: 6 },
  legalText: { fontSize: 8, color: "#475569", lineHeight: 1.5 },
  signaturesRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  signatureBox: { flex: 1, borderWidth: 1, borderColor: "#CBD5E1", padding: 8, minHeight: 75, alignItems: "center" },
  signatureLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#475569", marginBottom: 4 },
  qrSection: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 14, gap: 10 },
  qrBox: { borderWidth: 1, borderColor: "#CBD5E1", padding: 4 },
  qrCaption: { fontSize: 7, color: "#94A3B8", textAlign: "right", maxWidth: 160 },
  footer: {
    position: "absolute", bottom: 20, left: 44, right: 44,
    borderTopWidth: 0.5, borderTopColor: "#CBD5E1", paddingTop: 5,
    flexDirection: "row", justifyContent: "space-between",
  },
  hashText: { fontSize: 6, color: "#94A3B8", fontFamily: "Courier" },
  footerRight: { fontSize: 7, color: "#94A3B8" },
});

interface ConsentPdfProps {
  consent: any; patient: any; doctor: any; clinic: any;
  language: string; documentHash: string; consentUuid: string;
  legalData: any; qrDataUrl?: string;
}

export function ConsentPdf({ consent, patient, doctor, clinic, language, documentHash, consentUuid, legalData, qrDataUrl }: ConsentPdfProps) {
  const contentJson = getContentJson(consent.template)
  const content = contentJson[language] ?? contentJson['es-ES'] ?? {}

  const bodyText    = stripHtml(content.body    ?? legalData?.body    ?? '')
  const introText   = stripHtml(legalData?.introText  ?? '')
  const rightsText  = stripHtml(legalData?.rightsText ?? '')

  const patientName    = patient?.fullName ?? patient?.full_name ?? '—'
  const patientDoc     = patient?.idDocument ?? patient?.id_document ?? ''
  const patientDocType = patient?.idDocType  ?? patient?.id_doc_type  ?? ''
  const doctorName     = doctor?.name ?? '—'
  const doctorLicense  = doctor?.licenseNumber ?? doctor?.license_number ?? ''
  const doctorSpecialty = doctor?.specialty ?? ''

  const createdDate = consent.created_at ? new Date(consent.created_at).toLocaleString('es-ES') : ''
  const signedDate  = (consent.signedAt ?? consent.signed_at) ? new Date(consent.signedAt ?? consent.signed_at).toLocaleString('es-ES') : '—'
  const verifyUrl   = `https://consentimientos-production.up.railway.app/verify/${consentUuid}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{content.title ?? "Consentimiento Informado"}</Text>
            <Text style={styles.subtitle}>{clinic?.name ?? ''}{clinic?.trade_name ? ` · ${clinic.trade_name}` : ''}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.hashText}>UUID: {consentUuid}</Text>
            <Text style={styles.hashText}>{createdDate}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTES DEL CONSENTIMIENTO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Paciente:</Text>
            <Text style={styles.value}>{patientName}{patientDoc ? `  ·  ${patientDocType} ${patientDoc}` : ''}</Text>
          </View>
          {(patient?.phone) && <View style={styles.row}><Text style={styles.label}>Teléfono:</Text><Text style={styles.value}>{patient.phone}</Text></View>}
          {(patient?.email) && <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{patient.email}</Text></View>}
          <View style={styles.row}>
            <Text style={styles.label}>Doctor:</Text>
            <Text style={styles.value}>{doctorName}{doctorSpecialty ? `  ·  ${doctorSpecialty}` : ''}</Text>
          </View>
          {doctorLicense && (
            <View style={styles.row}>
              <Text style={styles.label}>Nº Colegiado:</Text>
              <Text style={styles.value}>{doctorLicense}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Fecha firma:</Text>
            <Text style={styles.value}>{signedDate}</Text>
          </View>
        </View>

        {/* Legal framework */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MARCO LEGAL — {legalData?.jurisdiction}</Text>
          <View style={styles.legalBox}>
            <Text style={styles.legalText}>{legalData?.applicableLaw}</Text>
          </View>
          {introText ? <Text style={styles.legalText}>{introText}</Text> : null}
        </View>

        {/* Consent body — full text */}
        {bodyText ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMACIÓN Y CONSENTIMIENTO</Text>
            <Text style={styles.bodyText}>{bodyText}</Text>
          </View>
        ) : null}

        {/* Patient rights */}
        {rightsText ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DERECHOS DEL PACIENTE</Text>
            <Text style={styles.legalText}>{rightsText}</Text>
          </View>
        ) : null}

        {/* Signatures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FIRMAS</Text>
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>FIRMA DEL DOCTOR</Text>
              {consent.doctor_signature_data_url ? (
                <Image src={consent.doctor_signature_data_url} style={{ height: 50 }} />
              ) : (
                <Text style={{ fontSize: 8, color: "#CBD5E1", marginTop: 14 }}>Sin firma</Text>
              )}
              <Text style={{ fontSize: 7, color: "#64748B", marginTop: 4 }}>{doctorName}</Text>
              {doctorLicense ? <Text style={{ fontSize: 6, color: "#94A3B8" }}>Nº Col. {doctorLicense}</Text> : null}
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>FIRMA DEL PACIENTE</Text>
              {(consent.signatureDataUrl ?? consent.signature_data_url) ? (
                <Image src={consent.signatureDataUrl ?? consent.signature_data_url} style={{ height: 50 }} />
              ) : (
                <Text style={{ fontSize: 8, color: "#CBD5E1", marginTop: 14 }}>Sin firma</Text>
              )}
              <Text style={{ fontSize: 7, color: "#64748B", marginTop: 4 }}>{patientName}</Text>
              <Text style={{ fontSize: 6, color: "#94A3B8" }}>{signedDate}</Text>
            </View>
          </View>
        </View>

        {/* QR */}
        {qrDataUrl && (
          <View style={styles.qrSection}>
            <View>
              <Text style={styles.qrCaption}>Escanea el QR para verificar{'\n'}la autenticidad de este documento</Text>
              <Text style={{ ...styles.hashText, marginTop: 4 }}>{verifyUrl}</Text>
            </View>
            <View style={styles.qrBox}>
              <Image src={qrDataUrl} style={{ width: 72, height: 72 }} />
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.hashText}>SHA-256: {documentHash ? documentHash.substring(0, 40) + '...' : '—'}</Text>
          <Text style={styles.footerRight}>{legalData?.footerLegal ?? ''}</Text>
        </View>

      </Page>
    </Document>
  )
}
