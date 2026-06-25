import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    borderBottomWidth: 1, borderBottomColor: "#1A2B4A",
    paddingBottom: 10, marginBottom: 16,
  },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1A2B4A" },
  section: { marginBottom: 12 },
  label: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#334155" },
  value: { fontSize: 10, color: "#0F172A", marginTop: 2 },
  legalText: {
    fontSize: 8.5, color: "#475569", lineHeight: 1.5,
    borderLeftWidth: 2, borderLeftColor: "#2563EB", paddingLeft: 8, marginTop: 6,
  },
  signatureBox: {
    borderWidth: 1, borderColor: "#CBD5E1", marginTop: 12,
    padding: 8, minHeight: 80, alignItems: "center",
  },
  footer: {
    position: "absolute", bottom: 20, left: 40, right: 40,
    borderTopWidth: 0.5, borderTopColor: "#CBD5E1", paddingTop: 6,
    fontSize: 7, color: "#94A3B8", flexDirection: "row",
    justifyContent: "space-between",
  },
  hashText: { fontSize: 6.5, color: "#94A3B8", fontFamily: "Courier" },
});

interface ConsentPdfProps {
  consent: any;
  patient: any;
  doctor: any;
  clinic: any;
  language: string;
  documentHash: string;
  consentUuid: string;
  legalData: any;
}

export function ConsentPdf({
  consent, patient, clinic, language, documentHash, consentUuid, legalData,
}: ConsentPdfProps) {
  const content =
    consent.template?.contentJson?.[language] ??
    consent.template?.contentJson?.["es-ES"] ?? {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{content.title ?? "Consentimiento Informado"}</Text>
            <Text style={{ fontSize: 9, color: "#64748B" }}>{clinic?.name ?? ""}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.hashText}>ID: {consentUuid}</Text>
            <Text style={styles.hashText}>{new Date().toLocaleDateString(language)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>PACIENTE</Text>
          <Text style={styles.value}>{patient?.fullName} · {patient?.idDocument}</Text>
          <Text style={styles.value}>{patient?.phone} · {patient?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>MARCO LEGAL — {legalData?.jurisdiction}</Text>
          <Text style={styles.legalText}>{legalData?.applicableLaw}</Text>
          <Text style={styles.legalText}>{legalData?.introText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.value}>{content.body ?? ""}</Text>
        </View>

        <View style={styles.signatureBox}>
          {consent.signatureDataUrl && (
            <Image src={consent.signatureDataUrl} style={{ height: 60 }} />
          )}
          <Text style={{ fontSize: 8, color: "#64748B", marginTop: 4 }}>
            {patient?.fullName} · {consent.signedAt ?? ""}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>SHA-256: {documentHash?.substring(0, 32)}...</Text>
          <Text>{legalData?.footerLegal}</Text>
        </View>
      </Page>
    </Document>
  );
}
