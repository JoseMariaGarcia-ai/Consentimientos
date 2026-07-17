import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const C = {
  navy:   '#1A2B4A',
  gold:   '#C9A84C',
  slate:  '#475569',
  light:  '#F1F5F9',
  border: '#CBD5E1',
  muted:  '#94A3B8',
  body:   '#334155',
  green:  '#0F766E',
}

const styles = StyleSheet.create({
  page: { padding: 44, fontFamily: 'Helvetica', fontSize: 10, color: '#0F172A' },

  titleBlock: {
    backgroundColor: C.navy, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  titleMain:       { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  titleClinic:     { fontSize: 9, color: '#94C3F8', marginTop: 3 },
  titleClinicMeta: { fontSize: 7.5, color: '#7FA8DE', marginTop: 2 },
  titleNumber:     { fontSize: 8, color: C.gold, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  titleDate:       { fontSize: 7, color: '#BFDBFE', textAlign: 'right', marginTop: 2 },

  section: { marginBottom: 14 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.navy,
    marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: C.border, paddingBottom: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row:   { flexDirection: 'row', marginBottom: 2 },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.slate, width: 110 },
  value: { fontSize: 9, color: '#0F172A', flex: 1 },

  amountsBox: { borderWidth: 0.5, borderColor: C.border, borderRadius: 2, padding: 10, gap: 3 },
  amountRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  amountLabel: { fontSize: 9, color: C.slate },
  amountValue: { fontSize: 9, color: '#0F172A' },

  totalBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.navy, borderRadius: 4, padding: 12, marginTop: 8,
  },
  totalLabel: { fontSize: 10, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 16, color: C.gold, fontFamily: 'Helvetica-Bold' },

  verifactuBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18,
    borderWidth: 0.5, borderColor: C.border, borderRadius: 4, padding: 10,
  },
  qrImage: { width: 90, height: 90 },
  verifactuText: { fontSize: 7.5, color: C.slate, lineHeight: 1.5 },
  verifactuLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.green, marginBottom: 3, letterSpacing: 0.5 },
  hashText: { fontSize: 7, color: C.muted, fontFamily: 'Courier' },

  footer: {
    position: 'absolute', bottom: 16, left: 44, right: 44,
    borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.5, color: C.muted },
})

interface InvoicePdfProps {
  clinic: any
  invoice: any
  qrDataUrl: string | null
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}
function fmtMoney(n: number) {
  return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export function InvoicePdf({ clinic, invoice, qrDataUrl }: InvoicePdfProps) {
  const lastAltaRecord = (invoice.records ?? []).slice().reverse().find((r: any) => r.record_type === 'alta')
  const shortHash = lastAltaRecord?.record_hash ? String(lastAltaRecord.record_hash).slice(-16) : ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.titleBlock}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleMain}>Factura</Text>
            <Text style={styles.titleClinic}>
              {invoice.issuer_name}
            </Text>
            <Text style={styles.titleClinicMeta}>
              {[
                `NIF: ${invoice.issuer_nif}`,
                clinic?.address ? `Domicilio: ${clinic.address}` : null,
                clinic?.phone ? `Tel: ${clinic.phone}` : null,
              ].filter(Boolean).join('  ·  ')}
            </Text>
          </View>
          <View>
            <Text style={styles.titleNumber}>Nº {invoice.invoice_number}</Text>
            <Text style={styles.titleDate}>{fmtDate(invoice.issue_date)}</Text>
            {invoice.status === 'anulada' && <Text style={[styles.titleDate, { color: '#FCA5A5' }]}>ANULADA</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del destinatario</Text>
          <View style={styles.row}><Text style={styles.label}>Nombre / Razón social:</Text><Text style={styles.value}>{invoice.recipient_name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>NIF:</Text><Text style={styles.value}>{invoice.recipient_nif}</Text></View>
          {invoice.recipient_address && (
            <View style={styles.row}><Text style={styles.label}>Domicilio:</Text><Text style={styles.value}>{invoice.recipient_address}</Text></View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Tipo de contribuyente:</Text>
            <Text style={styles.value}>{invoice.taxpayer_type === 'empresa' ? 'Empresa (Impuesto de Sociedades)' : 'Autónomo'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Concepto</Text>
          <Text style={styles.value}>{invoice.concept}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Importes</Text>
          <View style={styles.amountsBox}>
            <View style={styles.amountRow}><Text style={styles.amountLabel}>Base imponible</Text><Text style={styles.amountValue}>{fmtMoney(invoice.base_amount)}</Text></View>
            <View style={styles.amountRow}><Text style={styles.amountLabel}>IVA ({Number(invoice.vat_rate)}%)</Text><Text style={styles.amountValue}>{fmtMoney(invoice.vat_amount)}</Text></View>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total factura</Text>
            <Text style={styles.totalValue}>{fmtMoney(invoice.total_amount)}</Text>
          </View>
        </View>

        <View style={styles.verifactuBox}>
          {qrDataUrl && <Image src={qrDataUrl} style={styles.qrImage} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.verifactuLabel}>VERI*FACTU</Text>
            <Text style={styles.verifactuText}>
              Factura verificable en la sede electrónica de la AEAT. Sistema informático de facturación conforme al
              Reglamento de Requisitos de los Sistemas Informáticos de Facturación (RD 1007/2023).
            </Text>
            {shortHash && <Text style={[styles.hashText, { marginTop: 4 }]}>Huella de registro: …{shortHash}</Text>}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ConsentsPro · Factura generada digitalmente</Text>
          <Text style={styles.footerText}>{clinic?.email ?? ''}</Text>
        </View>

      </Page>
    </Document>
  )
}
