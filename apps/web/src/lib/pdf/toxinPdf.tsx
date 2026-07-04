import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const C = {
  navy:   '#1A2B4A',
  blue:   '#2563EB',
  slate:  '#475569',
  light:  '#F1F5F9',
  border: '#CBD5E1',
  muted:  '#94A3B8',
  body:   '#334155',
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#0F172A' },

  titleBlock: {
    backgroundColor: C.navy, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  titleMain:   { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  titleClinic: { fontSize: 8.5, color: '#94C3F8', marginTop: 3 },
  titleDate:   { fontSize: 7, color: '#BFDBFE', textAlign: 'right' },

  filtersBox: { backgroundColor: C.light, borderRadius: 4, padding: 8, marginBottom: 12 },
  filtersText: { fontSize: 7.5, color: C.slate },

  table: { borderWidth: 0.5, borderColor: C.border, borderRadius: 2 },
  tHeadRow: { flexDirection: 'row', backgroundColor: C.navy },
  tRow:     { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.border },
  tRowAlt:  { backgroundColor: '#F8FAFC' },
  th: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', padding: 5, textTransform: 'uppercase' },
  td: { fontSize: 7, color: C.body, padding: 5 },

  colDate: { width: '11%' },
  colPatient: { width: '18%' },
  colDoctor: { width: '14%' },
  colBrand: { width: '13%' },
  colLot: { width: '12%' },
  colExpiry: { width: '10%' },
  colZones: { width: '14%' },
  colUnits: { width: '8%', textAlign: 'right' },

  summaryBox: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: C.light, borderRadius: 4, padding: 10, marginTop: 12,
  },
  summaryLabel: { fontSize: 8, color: C.slate },
  summaryValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.navy },

  footer: {
    position: 'absolute', bottom: 16, left: 40, right: 40,
    borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5,
    textAlign: 'center',
  },
  footerText: { fontSize: 6.5, color: C.muted },
})

interface ToxinPdfProps {
  clinic: any
  records: any[]
  filters: { date_from?: string; date_to?: string; doctor_name?: string; patient_name?: string; lot_number?: string }
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}
function fmtDateTime(d?: string) {
  return d ? new Date(d).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

export function ToxinPdf({ clinic, records, filters }: ToxinPdfProps) {
  const generatedAt = new Date().toLocaleString('es-ES')
  const totalUnits = records.reduce((sum, r) => sum + (Number(r.total_units) || 0), 0)

  const filterParts = [
    filters.date_from ? `Desde: ${fmtDate(filters.date_from)}` : null,
    filters.date_to ? `Hasta: ${fmtDate(filters.date_to)}` : null,
    filters.doctor_name ? `Doctor: ${filters.doctor_name}` : null,
    filters.patient_name ? `Paciente: ${filters.patient_name}` : null,
    filters.lot_number ? `Lote: ${filters.lot_number}` : null,
  ].filter(Boolean)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.titleBlock}>
          <View>
            <Text style={styles.titleMain}>Control de Toxina Botulínica</Text>
            <Text style={styles.titleClinic}>
              {clinic?.trade_name ?? clinic?.name ?? ''}
              {clinic?.legal_name ? `  ·  ${clinic.legal_name}` : ''}
              {clinic?.tax_id ? `  ·  CIF/NIF: ${clinic.tax_id}` : ''}
            </Text>
          </View>
          <Text style={styles.titleDate}>Generado: {generatedAt}</Text>
        </View>

        {filterParts.length > 0 && (
          <View style={styles.filtersBox}>
            <Text style={styles.filtersText}>Filtros aplicados: {filterParts.join('  ·  ')}</Text>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.th, styles.colDate]}>Fecha</Text>
            <Text style={[styles.th, styles.colPatient]}>Paciente</Text>
            <Text style={[styles.th, styles.colDoctor]}>Doctor</Text>
            <Text style={[styles.th, styles.colBrand]}>Nombre comercial</Text>
            <Text style={[styles.th, styles.colLot]}>Lote</Text>
            <Text style={[styles.th, styles.colExpiry]}>Caducidad</Text>
            <Text style={[styles.th, styles.colZones]}>Zonas</Text>
            <Text style={[styles.th, styles.colUnits]}>Unidades</Text>
          </View>
          {records.map((r, i) => {
            const patientName = r.patient?.full_name ?? r.patient?.fullName ?? '—'
            const doctorName = r.doctor?.name ?? '—'
            const zonesText = Array.isArray(r.treated_zones) ? r.treated_zones.map((z: any) => z.zone).join(', ') : ''
            return (
              <View key={r.id ?? i} style={[styles.tRow, i % 2 === 1 ? styles.tRowAlt : {}]} wrap={false}>
                <Text style={[styles.td, styles.colDate]}>{fmtDateTime(r.application_date)}</Text>
                <Text style={[styles.td, styles.colPatient]}>{patientName}</Text>
                <Text style={[styles.td, styles.colDoctor]}>{doctorName}</Text>
                <Text style={[styles.td, styles.colBrand]}>{r.brand_name}</Text>
                <Text style={[styles.td, styles.colLot]}>{r.lot_number}</Text>
                <Text style={[styles.td, styles.colExpiry]}>{fmtDate(r.expiry_date)}</Text>
                <Text style={[styles.td, styles.colZones]}>{zonesText}</Text>
                <Text style={[styles.td, styles.colUnits]}>{r.total_units}</Text>
              </View>
            )
          })}
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total de registros: <Text style={styles.summaryValue}>{records.length}</Text></Text>
          <Text style={styles.summaryLabel}>Total de unidades aplicadas: <Text style={styles.summaryValue}>{totalUnits} U</Text></Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Registro de control de toxina botulínica — Uso interno sanitario</Text>
        </View>
      </Page>
    </Document>
  )
}
