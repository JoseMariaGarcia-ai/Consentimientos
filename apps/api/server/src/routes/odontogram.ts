import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { resolvePatientDoctorScope, ownPatientIdsSubquery, patientInScope } from '../lib/doctorScope'

const router = Router()

const TOOTH_STATUSES = [
  'sano', 'ausente', 'extraido', 'a_extraer', 'implante', 'corona',
  'puente', 'endodoncia', 'movil', 'incluido', 'temporal_presente',
]
const FACE_NAMES = ['vestibular', 'lingual_palatina', 'mesial', 'distal', 'oclusal_incisal']
const FACE_CONDITIONS = ['sana', 'caries', 'obturada', 'sellante', 'fractura', 'desgaste']

async function belongsToClinic(table: string, id: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1 AND clinic_id = $2`, [id, clinicId])
  return !!row
}

async function getClinicId(userId: string): Promise<string | null> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  return row?.clinic_id ?? null
}

// Normaliza y valida la lista de dientes recibida — nunca confiar en el
// shape que manda el cliente para lo que acaba en una columna JSONB.
function normalizeTeeth(input: any): any[] | null {
  if (!Array.isArray(input)) return null
  const out = []
  for (const t of input) {
    // Cuadrantes 1-4 (permanente): posiciones 1-8. Cuadrantes 5-8 (temporal): posiciones 1-5.
    if (!t || typeof t.number !== 'string' || !/^([1-4][1-8]|[5-8][1-5])$/.test(t.number)) return null
    if (!TOOTH_STATUSES.includes(t.status)) return null
    const faces: Record<string, { condition: string; material: string | null }> = {}
    const inFaces = t.faces && typeof t.faces === 'object' ? t.faces : {}
    for (const face of FACE_NAMES) {
      const f = inFaces[face]
      const condition = f && FACE_CONDITIONS.includes(f.condition) ? f.condition : 'sana'
      const material = f && typeof f.material === 'string' ? f.material : null
      faces[face] = { condition, material }
    }
    out.push({
      number: t.number,
      status: t.status,
      material: typeof t.material === 'string' ? t.material : null,
      notes: typeof t.notes === 'string' ? t.notes : '',
      faces,
    })
  }
  return out
}

// GET /api/odontogram?patient_id= — todas las visitas del paciente, más
// recientes primero (la línea de tiempo del historial las reordena si hace falta).
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id } = req.query
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.json([])
    if (!patient_id) return res.status(400).json({ error: 'patient_id requerido' })
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.json([])
    if (scope && !(await patientInScope(patient_id as string, scope))) return res.json([])

    const data = await query(
      `SELECT o.*, row_to_json(d) AS doctor
       FROM odontogram_records o
       LEFT JOIN doctors d ON d.id = o.doctor_id
       WHERE o.clinic_id = $1 AND o.patient_id = $2
       ORDER BY o.record_date DESC`,
      [clinicId, patient_id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(404).json({ error: 'Registro no encontrado' })
    let sql = `SELECT o.*, row_to_json(d) AS doctor
       FROM odontogram_records o
       LEFT JOIN doctors d ON d.id = o.doctor_id
       WHERE o.id = $1 AND o.clinic_id = $2`
    const params: any[] = [req.params.id, clinicId]
    if (scope) { params.push(scope); sql += ` AND o.patient_id IN ${ownPatientIdsSubquery(params.length)}` }
    const data = await queryOne(sql, params)
    if (!data) return res.status(404).json({ error: 'Registro no encontrado' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/odontogram — nueva visita. Nunca se edita ni se borra un
// registro ya creado (igual que facturas y fichajes); una corrección se
// registra como una visita nueva.
router.post('/', async (req, res) => {
  const { userId } = (req as any).user
  const { patient_id, doctor_id, record_date, dentition_type, teeth, notes } = req.body
  try {
    const clinicId = await getClinicId(userId)
    if (!clinicId) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const scope = await resolvePatientDoctorScope(userId)
    if (scope === '') return res.status(403).json({ error: 'Tu cuenta no está vinculada a ninguna ficha de doctor' })
    if (!patient_id) return res.status(400).json({ error: 'patient_id es obligatorio' })
    if (!doctor_id) return res.status(400).json({ error: 'doctor_id es obligatorio' })
    if (!record_date) return res.status(400).json({ error: 'record_date es obligatorio' })
    if (!['permanente', 'temporal', 'mixta'].includes(dentition_type)) {
      return res.status(400).json({ error: 'dentition_type no válido' })
    }
    if (!(await belongsToClinic('patients', patient_id, clinicId))) return res.status(404).json({ error: 'Paciente no encontrado' })
    if (scope && !(await patientInScope(patient_id, scope))) return res.status(404).json({ error: 'Paciente no encontrado' })
    if (!(await belongsToClinic('doctors', doctor_id, clinicId))) return res.status(404).json({ error: 'Doctor no encontrado' })

    const normalizedTeeth = normalizeTeeth(teeth)
    if (!normalizedTeeth) return res.status(400).json({ error: 'teeth no válido' })

    const data = await queryOne(
      `INSERT INTO odontogram_records
         (clinic_id, patient_id, doctor_id, record_date, dentition_type, teeth, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [clinicId, patient_id, doctor_id, record_date, dentition_type, JSON.stringify(normalizedTeeth), notes ?? null, userId]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

export default router
