import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"

const C = {
  navy:   '#1A2B4A',
  gold:   '#C9A84C',
  slate:  '#475569',
  border: '#CBD5E1',
  muted:  '#94A3B8',
  body:   '#334155',
}

const styles = StyleSheet.create({
  page: { padding: 44, fontFamily: 'Helvetica', fontSize: 10, color: '#0F172A' },
  titleBlock: {
    backgroundColor: C.navy, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  titleMain:   { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  titleSub:    { fontSize: 9, color: '#94C3F8', marginTop: 3 },
  titleMeta:   { fontSize: 7.5, color: '#7FA8DE', marginTop: 2 },
  titleRight:  { fontSize: 8, color: C.gold, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  titleRightMeta: { fontSize: 7, color: '#BFDBFE', textAlign: 'right', marginTop: 2 },

  section: { marginBottom: 14 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.navy,
    marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: C.border, paddingBottom: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  table: { borderWidth: 0.5, borderColor: C.border, borderRadius: 2 },
  tHeadRow: { flexDirection: 'row', backgroundColor: C.navy },
  tRow:     { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.border },
  tRowAlt:  { backgroundColor: '#F8FAFC' },
  th: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', padding: 6 },
  td: { fontSize: 8.5, color: C.body, padding: 6 },
  colDate: { width: '20%' }, colType: { width: '25%' }, colMethod: { width: '20%' }, colTime: { width: '35%' },

  totalBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.navy, borderRadius: 4, padding: 12, marginTop: 8,
  },
  totalLabel: { fontSize: 10, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 16, color: C.gold, fontFamily: 'Helvetica-Bold' },

  hashBox: { marginTop: 18, borderWidth: 0.5, borderColor: C.border, borderRadius: 4, padding: 10 },
  hashLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.slate, marginBottom: 3 },
  hashText: { fontSize: 7, color: C.muted, fontFamily: 'Courier' },

  footer: {
    position: 'absolute', bottom: 16, left: 44, right: 44,
    borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.5, color: C.muted },
})

const RECORD_LABEL_ES: Record<string, string> = {
  entrada: 'Entrada', salida: 'Salida', inicio_pausa: 'Inicio de pausa', fin_pausa: 'Fin de pausa',
}
const METHOD_LABEL_ES: Record<string, string> = { web: 'App/Web', qr: 'Código QR', pin: 'PIN en terminal' }

function fmtDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface TimeTrackingPdfProps {
  data: any
  locale: string
}

export function TimeTrackingPdf({ data, locale }: TimeTrackingPdfProps) {
  const { employee, clinic, records = [], totalHours = 0, exportHash, period } = data
  const periodLabel = [period?.date_from, period?.date_to].filter(Boolean).join(' — ')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleBlock}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleMain}>Informe de control horario</Text>
            <Text style={styles.titleSub}>{clinic?.legal_name ?? clinic?.trade_name ?? clinic?.name ?? ''}</Text>
            <Text style={styles.titleMeta}>
              {[
                clinic?.tax_id ? `NIF: ${clinic.tax_id}` : null,
                periodLabel ? `Periodo: ${periodLabel}` : null,
              ].filter(Boolean).join('  ·  ')}
            </Text>
          </View>
          <View>
            <Text style={styles.titleRight}>{employee?.full_name}</Text>
            <Text style={[styles.titleRight, { color: '#BFDBFE' }]}>{employee?.dni_nie}</Text>
            {employee?.role && <Text style={styles.titleRightMeta}>{employee.role}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fichajes del periodo</Text>
          <View style={styles.table}>
            <View style={styles.tHeadRow}>
              <Text style={[styles.th, styles.colDate]}>Fecha</Text>
              <Text style={[styles.th, styles.colType]}>Tipo</Text>
              <Text style={[styles.th, styles.colMethod]}>Método</Text>
              <Text style={[styles.th, styles.colTime]}>Hora</Text>
            </View>
            {records.map((r: any, i: number) => (
              <View key={i} style={[styles.tRow, i % 2 === 1 ? styles.tRowAlt : {}]} wrap={false}>
                <Text style={[styles.td, styles.colDate]}>{new Date(r.timestamp_utc).toLocaleDateString(locale)}</Text>
                <Text style={[styles.td, styles.colType]}>{RECORD_LABEL_ES[r.record_type] ?? r.record_type}</Text>
                <Text style={[styles.td, styles.colMethod]}>{METHOD_LABEL_ES[r.method] ?? r.method}</Text>
                <Text style={[styles.td, styles.colTime]}>{fmtDateTime(r.timestamp_utc, locale)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total de horas</Text>
            <Text style={styles.totalValue}>{Number(totalHours).toFixed(2)} h</Text>
          </View>
        </View>

        <View style={styles.hashBox}>
          <Text style={styles.hashLabel}>Hash de integridad del conjunto exportado</Text>
          <Text style={styles.hashText}>{exportHash}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ConsentsPro · Informe de control horario generado digitalmente</Text>
          <Text style={styles.footerText}>{clinic?.email ?? ''}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function timeTrackingPdfBlob(data: any, locale: string) {
  return pdf(<TimeTrackingPdf data={data} locale={locale} />).toBlob()
}
