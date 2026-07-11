import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { OdontogramRecord, OdontogramTooth } from "@consentspro/shared-types"
import { PERMANENT_QUADRANTS, TEMPORARY_QUADRANTS, toothName } from "@/components/odontogram/toothMeta"

const C = {
  navy: '#1A2B4A', slate: '#475569', light: '#F1F5F9', border: '#CBD5E1', muted: '#94A3B8', body: '#334155',
}

const STATUS_LABEL: Record<string, string> = {
  sano: 'Sano', ausente: 'Ausente', extraido: 'Extraído', a_extraer: 'A extraer', implante: 'Implante',
  corona: 'Corona', puente: 'Puente', endodoncia: 'Endodoncia', movil: 'Móvil', incluido: 'Incluido',
  temporal_presente: 'Temporal presente',
}
const CONDITION_COLOR: Record<string, string> = {
  sana: '#FFFFFF', caries: '#EF4444', obturada: '#3B82F6', sellante: '#38BDF8', fractura: '#F97316', desgaste: '#FBBF24',
}
const FACE_LABEL: Record<string, string> = {
  vestibular: 'Vest.', lingual_palatina: 'Ling/Pal.', mesial: 'Mesial', distal: 'Distal', oclusal_incisal: 'Ocl/Inc.',
}

// Color representativo de un diente para la vista compacta del PDF: el
// estado general si es ausente/extraído, o si no la condición "más grave"
// entre sus 5 caras (no reproduce el detalle por cara — eso está en la
// tabla resumen debajo).
function toothColor(tooth: OdontogramTooth): string {
  if (tooth.status === 'ausente' || tooth.status === 'extraido') return '#CBD5E1'
  const priority = ['caries', 'fractura', 'obturada', 'sellante', 'desgaste']
  for (const cond of priority) {
    if (Object.values(tooth.faces).some(f => f.condition === cond)) return CONDITION_COLOR[cond]
  }
  return '#FFFFFF'
}

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 9, color: '#0F172A' },
  titleBlock: {
    backgroundColor: C.navy, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  titleMain: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  titleSub: { fontSize: 8.5, color: '#94C3F8', marginTop: 3 },
  titleRight: { fontSize: 8, color: '#C9A84C', fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  titleRightMeta: { fontSize: 7, color: '#BFDBFE', textAlign: 'right', marginTop: 2 },

  quadrants: { flexDirection: 'column', gap: 6, marginBottom: 14, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  half: { flexDirection: 'row', gap: 3 },
  midline: { width: 1, height: 34, backgroundColor: C.border },
  toothBox: { alignItems: 'center', gap: 2 },
  toothSquare: { width: 18, height: 18, borderWidth: 0.5, borderColor: C.muted, borderRadius: 2 },
  toothNum: { fontSize: 6, color: C.slate },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendSwatch: { width: 7, height: 7, borderWidth: 0.5, borderColor: C.muted, borderRadius: 1 },
  legendText: { fontSize: 6.5, color: C.slate },

  sectionTitle: {
    fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.navy, marginBottom: 5,
    borderBottomWidth: 0.5, borderBottomColor: C.border, paddingBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  table: { borderWidth: 0.5, borderColor: C.border, borderRadius: 2 },
  tHeadRow: { flexDirection: 'row', backgroundColor: C.navy },
  tRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.border },
  tRowAlt: { backgroundColor: '#F8FAFC' },
  th: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', padding: 4 },
  td: { fontSize: 7, color: C.body, padding: 4 },
  colNum: { width: '7%' }, colName: { width: '22%' }, colStatus: { width: '14%' },
  colFaces: { width: '42%' }, colNotes: { width: '15%' },

  footer: {
    position: 'absolute', bottom: 16, left: 36, right: 36,
    borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.5, color: C.muted },
})

interface OdontogramPdfProps {
  clinic: any
  patient: any
  record: OdontogramRecord
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}

export function OdontogramPdf({ clinic, patient, record }: OdontogramPdfProps) {
  const byNumber = new Map(record.teeth.map(t => [t.number, t]))
  const showPermanent = record.dentition_type === 'permanente' || record.dentition_type === 'mixta'
  const showTemporary = record.dentition_type === 'temporal' || record.dentition_type === 'mixta'
  const findings = record.teeth.filter(t =>
    t.status !== 'sano' || Object.values(t.faces).some(f => f.condition !== 'sana')
  )

  const renderQuadrantRow = (left: string[], right: string[]) => (
    <View style={styles.row}>
      <View style={styles.half}>
        {left.map(n => {
          const tooth = byNumber.get(n)
          return (
            <View key={n} style={styles.toothBox}>
              <View style={[styles.toothSquare, { backgroundColor: tooth ? toothColor(tooth) : '#FFFFFF' }]} />
              <Text style={styles.toothNum}>{n}</Text>
            </View>
          )
        })}
      </View>
      <View style={styles.midline} />
      <View style={styles.half}>
        {right.map(n => {
          const tooth = byNumber.get(n)
          return (
            <View key={n} style={styles.toothBox}>
              <View style={[styles.toothSquare, { backgroundColor: tooth ? toothColor(tooth) : '#FFFFFF' }]} />
              <Text style={styles.toothNum}>{n}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleBlock}>
          <View>
            <Text style={styles.titleMain}>Odontograma</Text>
            <Text style={styles.titleSub}>{clinic?.legal_name ?? clinic?.trade_name ?? clinic?.name ?? ''}{clinic?.tax_id ? `  ·  NIF: ${clinic.tax_id}` : ''}</Text>
          </View>
          <View>
            <Text style={styles.titleRight}>{patient?.full_name ?? patient?.fullName ?? ''}</Text>
            <Text style={styles.titleRightMeta}>Fecha: {fmtDate(record.record_date)}</Text>
            {record.doctor?.name && <Text style={styles.titleRightMeta}>Dr./Dra.: {record.doctor.name}</Text>}
          </View>
        </View>

        <View style={styles.quadrants}>
          {showPermanent && (
            <>
              {renderQuadrantRow(PERMANENT_QUADRANTS[0], PERMANENT_QUADRANTS[1])}
              {renderQuadrantRow(PERMANENT_QUADRANTS[2], PERMANENT_QUADRANTS[3])}
            </>
          )}
          {showTemporary && (
            <>
              {renderQuadrantRow(TEMPORARY_QUADRANTS[0], TEMPORARY_QUADRANTS[1])}
              {renderQuadrantRow(TEMPORARY_QUADRANTS[2], TEMPORARY_QUADRANTS[3])}
            </>
          )}
        </View>

        <View style={styles.legend}>
          {Object.entries(CONDITION_COLOR).map(([cond, color]) => (
            <View key={cond} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{cond === 'sana' ? 'Sano' : cond.charAt(0).toUpperCase() + cond.slice(1)}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#CBD5E1' }]} />
            <Text style={styles.legendText}>Ausente/Extraído</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tabla resumen de hallazgos</Text>
        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.th, styles.colNum]}>FDI</Text>
            <Text style={[styles.th, styles.colName]}>Diente</Text>
            <Text style={[styles.th, styles.colStatus]}>Estado</Text>
            <Text style={[styles.th, styles.colFaces]}>Caras alteradas</Text>
            <Text style={[styles.th, styles.colNotes]}>Notas</Text>
          </View>
          {findings.length === 0 ? (
            <View style={styles.tRow}><Text style={[styles.td, { padding: 8 }]}>Sin hallazgos — dentición sana en esta visita.</Text></View>
          ) : findings.map((t, i) => {
            const alteredFaces = Object.entries(t.faces)
              .filter(([, f]) => f.condition !== 'sana')
              .map(([face, f]) => `${FACE_LABEL[face] ?? face}: ${f.condition}${f.material ? ` (${f.material})` : ''}`)
              .join(', ')
            return (
              <View key={t.number} style={[styles.tRow, i % 2 === 1 ? styles.tRowAlt : {}]} wrap={false}>
                <Text style={[styles.td, styles.colNum]}>{t.number}</Text>
                <Text style={[styles.td, styles.colName]}>{toothName(t.number)}</Text>
                <Text style={[styles.td, styles.colStatus]}>{STATUS_LABEL[t.status] ?? t.status}</Text>
                <Text style={[styles.td, styles.colFaces]}>{alteredFaces || '—'}</Text>
                <Text style={[styles.td, styles.colNotes]}>{t.notes || '—'}</Text>
              </View>
            )
          })}
        </View>

        {record.notes && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionTitle}>Notas de la visita</Text>
            <Text style={{ fontSize: 8, color: C.body }}>{record.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>ConsentsPro · Odontograma generado digitalmente</Text>
          <Text style={styles.footerText}>{clinic?.email ?? ''}</Text>
        </View>
      </Page>
    </Document>
  )
}
