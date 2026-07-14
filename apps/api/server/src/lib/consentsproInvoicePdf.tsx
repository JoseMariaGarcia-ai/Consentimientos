import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from '@react-pdf/renderer'

// Misma paleta que apps/web/src/lib/pdf/invoicePdf.tsx (facturas VeriFactu),
// para mantener consistencia visual entre ambos tipos de documento.
const C = {
  navy:   '#1A2B4A',
  gold:   '#C9A84C',
  slate:  '#475569',
  border: '#CBD5E1',
  muted:  '#94A3B8',
}

const styles = StyleSheet.create({
  page: { padding: 44, fontFamily: 'Helvetica', fontSize: 10, color: '#0F172A' },
  titleBlock: {
    backgroundColor: C.navy, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleMain: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  titleSub: { fontSize: 8, color: '#94C3F8', marginTop: 2 },
  titleIssuer: { fontSize: 9, color: '#94C3F8', marginTop: 6 },
  titleIssuerMeta: { fontSize: 7.5, color: '#7FA8DE', marginTop: 2 },
  titleNumber: { fontSize: 8, color: C.gold, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  titleDate: { fontSize: 7, color: '#BFDBFE', textAlign: 'right', marginTop: 2 },

  section: { marginBottom: 14 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.navy,
    marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: C.border, paddingBottom: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.slate, width: 130 },
  value: { fontSize: 9, color: '#0F172A', flex: 1 },

  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.border },
  lineLabel: { fontSize: 9, color: '#0F172A' },
  lineAmount: { fontSize: 9, color: '#0F172A' },

  totalBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.navy, borderRadius: 4, padding: 12, marginTop: 8,
  },
  totalLabel: { fontSize: 10, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 16, color: C.gold, fontFamily: 'Helvetica-Bold' },

  reverseChargeBox: {
    borderWidth: 0.5, borderColor: C.border, borderRadius: 4,
    padding: 10, marginTop: 18,
  },
  reverseChargeLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.navy, marginBottom: 3, letterSpacing: 0.3 },
  reverseChargeText: { fontSize: 7, color: C.slate, lineHeight: 1.5 },

  footer: {
    position: 'absolute', bottom: 16, left: 44, right: 44,
    borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.5, color: C.muted },
})

// Nota legal fija: la sociedad emisora está constituida en EEUU, sin
// establecimiento permanente en España/UE, y presta servicios digitales a
// clínicas (empresarios/profesionales) establecidas en España — la
// operación se localiza en destino (art. 69.Uno.1º LIVA / art. 44 Directiva
// 2006/112/CE) y es el destinatario quien autoliquida el IVA por inversión
// del sujeto pasivo (art. 84.Uno.2º.a) LIVA / art. 196 Directiva 2006/112/CE),
// por eso esta factura no repercute IVA — no es una "exención", es un
// cambio de quién debe declararlo.
function reverseChargeNote(issuerName: string): string {
  return `${issuerName} es una entidad no establecida en el territorio de aplicación del impuesto (Estados Unidos) que presta servicios electrónicos a un empresario o profesional establecido en España. De acuerdo con los artículos 69.Uno.1º y 84.Uno.2º.a) de la Ley 37/1992 del Impuesto sobre el Valor Añadido, en relación con los artículos 44 y 196 de la Directiva 2006/112/CE del Consejo, de 28 de noviembre de 2006, corresponde al destinatario la autoliquidación del impuesto (inversión del sujeto pasivo).`
}

export interface ConsentsProInvoiceData {
  invoiceNumber: string
  issueDate: string // ISO
  periodStart: string
  periodEnd: string
  issuerName: string
  issuerAddress: string | null
  issuerTaxId: string | null
  customerName: string
  customerTaxId: string | null
  customerAddress: string | null
  planName: string
  baseAmountCents: number
  vatAmountCents: number
  totalAmountCents: number
  aiCreditTopupCents: number | null
  logoDataUrl: string | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtMoney(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function ConsentsProInvoicePdf({ data }: { data: ConsentsProInvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleBlock}>
          <View style={{ flex: 1 }}>
            <View style={styles.logoRow}>
              {data.logoDataUrl && <Image src={data.logoDataUrl} style={{ width: 20, height: 20 }} />}
              <Text style={styles.titleMain}>Factura</Text>
            </View>
            <Text style={styles.titleSub}>Suscripción ConsentsPro</Text>
            <Text style={styles.titleIssuer}>{data.issuerName}</Text>
            <Text style={styles.titleIssuerMeta}>
              {[data.issuerTaxId ? `NIF/CIF: ${data.issuerTaxId}` : null, data.issuerAddress].filter(Boolean).join('  ·  ')}
            </Text>
          </View>
          <View>
            <Text style={styles.titleNumber}>Nº {data.invoiceNumber}</Text>
            <Text style={styles.titleDate}>{fmtDate(data.issueDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del cliente</Text>
          <View style={styles.row}><Text style={styles.label}>Nombre / Razón social:</Text><Text style={styles.value}>{data.customerName}</Text></View>
          {data.customerTaxId && (
            <View style={styles.row}><Text style={styles.label}>NIF/CIF:</Text><Text style={styles.value}>{data.customerTaxId}</Text></View>
          )}
          {data.customerAddress && (
            <View style={styles.row}><Text style={styles.label}>Domicilio:</Text><Text style={styles.value}>{data.customerAddress}</Text></View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Periodo facturado:</Text>
            <Text style={styles.value}>{fmtDate(data.periodStart)} — {fmtDate(data.periodEnd)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle</Text>
          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>{data.planName} (suscripción)</Text>
            <Text style={styles.lineAmount}>{fmtMoney(data.baseAmountCents)}</Text>
          </View>
          {!!data.aiCreditTopupCents && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Recarga de saldo IA (Bono IA) del periodo</Text>
              <Text style={styles.lineAmount}>{fmtMoney(data.aiCreditTopupCents)}</Text>
            </View>
          )}
          {data.vatAmountCents > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>IVA</Text>
              <Text style={styles.lineAmount}>{fmtMoney(data.vatAmountCents)}</Text>
            </View>
          )}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total factura</Text>
            <Text style={styles.totalValue}>{fmtMoney(data.totalAmountCents)}</Text>
          </View>
        </View>

        <View style={styles.reverseChargeBox}>
          <Text style={styles.reverseChargeLabel}>IVA NO REPERCUTIDO — INVERSIÓN DEL SUJETO PASIVO</Text>
          <Text style={styles.reverseChargeText}>{reverseChargeNote(data.issuerName)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ConsentsPro · Factura generada digitalmente</Text>
          <Text style={styles.footerText}>soporte@consentspro.com</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function renderConsentsProInvoicePdf(data: ConsentsProInvoiceData): Promise<Buffer> {
  return renderToBuffer(<ConsentsProInvoicePdf data={data} />) as unknown as Promise<Buffer>
}
