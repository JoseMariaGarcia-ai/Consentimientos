import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const C = {
  navy:   '#1A2B4A',
  gold:   '#C9A84C',
  slate:  '#475569',
  light:  '#F1F5F9',
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
  label: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.slate, width: 90 },
  value: { fontSize: 9, color: '#0F172A', flex: 1 },

  table: { borderWidth: 0.5, borderColor: C.border, borderRadius: 2 },
  tHeadRow: { flexDirection: 'row', backgroundColor: C.navy },
  tRow:     { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.border },
  tRowAlt:  { backgroundColor: '#F8FAFC' },
  th: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', padding: 7, textTransform: 'uppercase' },
  td: { fontSize: 9, color: C.body, padding: 7 },
  colTreatment: { width: '70%' },
  colPrice:     { width: '30%', textAlign: 'right' },

  totalBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.navy, borderRadius: 4, padding: 12, marginTop: 8,
  },
  totalLabel: { fontSize: 10, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 16, color: C.gold, fontFamily: 'Helvetica-Bold' },

  noteBox: { backgroundColor: C.light, borderLeftWidth: 3, borderLeftColor: C.gold, padding: 10, marginTop: 16 },
  noteText: { fontSize: 8, color: C.slate, lineHeight: 1.5 },

  footer: {
    position: 'absolute', bottom: 16, left: 44, right: 44,
    borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.5, color: C.muted },
})

interface BudgetItem { treatment_name: string; price: number }
interface BudgetPdfProps {
  clinic: any
  patient: any
  items: BudgetItem[]
  budgetNumber: string
  createdAt: string
  validUntil?: string
  notes?: string
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}
function fmtMoney(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export function BudgetPdf({ clinic, patient, items, budgetNumber, createdAt, validUntil, notes }: BudgetPdfProps) {
  const total = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0)
  const patientName = patient?.full_name ?? patient?.fullName ?? '—'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.titleBlock}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleMain}>Presupuesto</Text>
            <Text style={styles.titleClinic}>
              {clinic?.trade_name ?? clinic?.name ?? ''}
              {clinic?.legal_name ? `  ·  Razón social: ${clinic.legal_name}` : ''}
            </Text>
            {(clinic?.tax_id || clinic?.address || clinic?.phone) && (
              <Text style={styles.titleClinicMeta}>
                {[
                  clinic?.tax_id ? `CIF/NIF: ${clinic.tax_id}` : null,
                  clinic?.address ? `Domicilio: ${clinic.address}` : null,
                  clinic?.phone ? `Tel: ${clinic.phone}` : null,
                ].filter(Boolean).join('  ·  ')}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.titleNumber}>Nº {budgetNumber}</Text>
            <Text style={styles.titleDate}>{fmtDate(createdAt)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del paciente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Paciente:</Text>
            <Text style={styles.value}>{patientName}</Text>
          </View>
          {patient?.phone && <View style={styles.row}><Text style={styles.label}>Teléfono:</Text><Text style={styles.value}>{patient.phone}</Text></View>}
          {patient?.email && <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{patient.email}</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tratamientos presupuestados</Text>
          <View style={styles.table}>
            <View style={styles.tHeadRow}>
              <Text style={[styles.th, styles.colTreatment]}>Tratamiento</Text>
              <Text style={[styles.th, styles.colPrice]}>Precio</Text>
            </View>
            {items.map((it, i) => (
              <View key={i} style={[styles.tRow, i % 2 === 1 ? styles.tRowAlt : {}]} wrap={false}>
                <Text style={[styles.td, styles.colTreatment]}>{it.treatment_name}</Text>
                <Text style={[styles.td, styles.colPrice]}>{fmtMoney(Number(it.price) || 0)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total presupuesto</Text>
            <Text style={styles.totalValue}>{fmtMoney(total)}</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Este presupuesto tiene carácter informativo y no vincula a su aceptación.
            {validUntil ? ` Válido hasta el ${fmtDate(validUntil)}.` : ''}
            {notes ? `\n${notes}` : ''}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ConsentsPro · Presupuesto generado digitalmente</Text>
          <Text style={styles.footerText}>{clinic?.email ?? ''}</Text>
        </View>

      </Page>
    </Document>
  )
}
