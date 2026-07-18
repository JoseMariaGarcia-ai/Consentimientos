import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { query, queryOne, withTransaction } from '../lib/db'
import { computeTimeRecordHash } from '../lib/timeTrackingHash'
import { verifyClinicTimeChain } from '../lib/timeTrackingIntegrity'
import { computeWorkedHours, currentStatus } from '../lib/timeTrackingHours'
import { getPlanPermissions } from '../lib/planPermissions'

const router = Router()
export const publicRouter = Router()

const MANAGER_ROLES = ['superadmin', 'admin', 'clinica']

async function getUser(userId: string) {
  return queryOne<{ clinic_id: string | null; role: string }>('SELECT clinic_id, role FROM app_users WHERE id = $1', [userId])
}

async function requireManager(userId: string): Promise<string | null> {
  const me = await getUser(userId)
  if (!me?.clinic_id || !MANAGER_ROLES.includes(me.role)) return null
  return me.clinic_id
}

async function ownEmployee(userId: string, clinicId: string) {
  return queryOne<{ id: string; active: boolean }>(
    'SELECT id, active FROM employees WHERE app_user_id = $1 AND clinic_id = $2', [userId, clinicId]
  )
}

async function belongsToClinic(table: string, id: string, clinicId: string): Promise<boolean> {
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1 AND clinic_id = $2`, [id, clinicId])
  return !!row
}

async function insertClockRecord(client: any, params: {
  clinicId: string; employeeId: string; recordType: string; method: string
  latitude: number | null; longitude: number | null; ipAddress: string | null; deviceInfo: string | null
  timestampUtc?: string | Date
}) {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [params.employeeId])
  const { rows: prevRows } = await client.query(
    'SELECT record_hash FROM time_records WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1', [params.employeeId]
  )
  const previousHash: string | null = prevRows[0]?.record_hash ?? null
  // params.timestampUtc puede llegar como Date (p. ej. una columna TIMESTAMPTZ
  // leída de vuelta de Postgres, como incident.proposed_timestamp) — hay que
  // normalizarlo SIEMPRE a string ISO antes de hashear: computeTimeRecordHash
  // interpola el valor en un template literal, y `${Date}` usa .toString()
  // (formato distinto de .toISOString()), lo que generaría un hash
  // irreproducible en verifyClinicTimeChain().
  const timestampUtc = params.timestampUtc ? new Date(params.timestampUtc).toISOString() : new Date().toISOString()
  const recordHash = computeTimeRecordHash({
    employeeId: params.employeeId,
    recordType: params.recordType as any,
    timestampUtc,
    latitude: params.latitude,
    longitude: params.longitude,
    previousHash,
  })
  const { rows } = await client.query(
    `INSERT INTO time_records (
       clinic_id, employee_id, record_type, timestamp_utc, method, latitude, longitude,
       ip_address, device_info, record_hash, previous_hash
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      params.clinicId, params.employeeId, params.recordType, timestampUtc, params.method,
      params.latitude, params.longitude, params.ipAddress, params.deviceInfo, recordHash, previousHash,
    ]
  )
  return rows[0]
}

// ---- Empleados (responsable de la clínica) --------------------------------

router.get('/employees', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.status(403).json({ error: 'Solo el responsable de la clínica puede gestionar empleados' })
    const employees = await query(
      `SELECT e.id, e.full_name, e.dni_nie, e.role, e.email, e.active, e.app_user_id, e.created_at,
         (SELECT record_type FROM time_records WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1) AS last_record_type
       FROM employees e WHERE e.clinic_id = $1 ORDER BY e.full_name ASC`,
      [clinicId]
    )
    const withStatus = (employees as any[]).map(e => ({ ...e, status: currentStatus(e.last_record_type) }))
    return res.json(withStatus)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/employees', async (req, res) => {
  const { userId } = (req as any).user
  const { full_name, dni_nie, role, email, pin, app_user_id } = req.body
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.status(403).json({ error: 'Solo el responsable de la clínica puede gestionar empleados' })
    const name = String(full_name ?? '').trim()
    const dni = String(dni_nie ?? '').trim().toUpperCase()
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' })
    if (!dni) return res.status(400).json({ error: 'El DNI/NIE es obligatorio' })
    if (app_user_id && !(await belongsToClinic('app_users', app_user_id, clinicId))) {
      return res.status(404).json({ error: 'Usuario no encontrado en esta clínica' })
    }
    const pinHash = pin ? await bcrypt.hash(String(pin), 10) : null
    const employee = await queryOne(
      `INSERT INTO employees (clinic_id, full_name, dni_nie, role, email, pin_hash, app_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, full_name, dni_nie, role, email, active, app_user_id, created_at`,
      [clinicId, name, dni, role ?? null, email ?? null, pinHash, app_user_id ?? null]
    )
    return res.status(201).json(employee)
  } catch (err: any) {
    if (String(err.message).includes('duplicate key')) return res.status(409).json({ error: 'Ya existe un empleado con ese DNI/NIE en esta clínica' })
    return res.status(400).json({ error: err.message })
  }
})

router.put('/employees/:id', async (req, res) => {
  const { userId } = (req as any).user
  const { full_name, role, email, active, pin } = req.body
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.status(403).json({ error: 'Solo el responsable de la clínica puede gestionar empleados' })
    if (!(await belongsToClinic('employees', req.params.id, clinicId))) return res.status(404).json({ error: 'Empleado no encontrado' })
    const pinHash = pin ? await bcrypt.hash(String(pin), 10) : undefined
    const employee = await queryOne(
      `UPDATE employees SET
         full_name = COALESCE($1, full_name), role = $2, email = $3, active = COALESCE($4, active),
         pin_hash = COALESCE($5, pin_hash)
       WHERE id = $6 AND clinic_id = $7
       RETURNING id, full_name, dni_nie, role, email, active, app_user_id, created_at`,
      [full_name ?? null, role ?? null, email ?? null, active ?? null, pinHash ?? null, req.params.id, clinicId]
    )
    return res.json(employee)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// ---- Configuración de métodos ---------------------------------------------

router.get('/settings', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.status(403).json({ error: 'Solo el responsable de la clínica puede ver esta configuración' })
    const row = await queryOne<{ time_tracking_methods: string[] }>('SELECT time_tracking_methods FROM clinics WHERE id = $1', [clinicId])
    return res.json({ methods: row?.time_tracking_methods ?? ['web'] })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/settings', async (req, res) => {
  const { userId } = (req as any).user
  const { methods } = req.body
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.status(403).json({ error: 'Solo el responsable de la clínica puede editar esta configuración' })
    const valid = ['web', 'qr', 'pin']
    const clean = Array.isArray(methods) ? methods.filter((m: string) => valid.includes(m)) : ['web']
    await query('UPDATE clinics SET time_tracking_methods = $1 WHERE id = $2', [clean.length ? clean : ['web'], clinicId])
    return res.json({ methods: clean.length ? clean : ['web'] })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// ---- Estado actual del propio empleado (dentro/fuera/en_pausa) ------------

// Se basa en el último fichaje SIN filtro de fecha (igual que la columna
// "status" de /employees) — filtrar por "hoy" rompería el estado de un
// turno que cruza medianoche (fichaje de "entrada" hecho el día anterior).
router.get('/status', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const me = await getUser(userId)
    if (!me?.clinic_id) return res.json({ status: 'fuera' })
    const employee = await ownEmployee(userId, me.clinic_id)
    if (!employee) return res.json({ status: 'fuera' })
    const last = await queryOne<{ record_type: string }>(
      'SELECT record_type FROM time_records WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1', [employee.id]
    )
    return res.json({ status: currentStatus(last?.record_type ?? null) })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// ---- Fichar (empleado autenticado — web / enlace QR) -----------------------

// El employee_id nunca lo manda el cliente: se resuelve del app_user
// autenticado, igual que el clinic_id nunca se toma del cuerpo de la
// petición en el resto de la app.
router.post('/clock', async (req, res) => {
  const { userId } = (req as any).user
  const { record_type, latitude, longitude, method } = req.body
  try {
    const me = await getUser(userId)
    if (!me?.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const employee = await ownEmployee(userId, me.clinic_id)
    if (!employee) return res.status(404).json({ error: 'No hay un empleado de fichaje vinculado a tu usuario' })
    if (!employee.active) return res.status(403).json({ error: 'Tu ficha de empleado está inactiva' })
    if (!['entrada', 'salida', 'inicio_pausa', 'fin_pausa'].includes(record_type)) {
      return res.status(400).json({ error: 'Tipo de fichaje no válido' })
    }
    const lat = latitude != null ? Number(latitude) : null
    const lng = longitude != null ? Number(longitude) : null
    const record = await withTransaction(client => insertClockRecord(client, {
      clinicId: me.clinic_id!, employeeId: employee.id, recordType: record_type,
      method: method === 'qr' ? 'qr' : 'web',
      latitude: Number.isFinite(lat) ? lat : null, longitude: Number.isFinite(lng) ? lng : null,
      ipAddress: req.ip ?? null, deviceInfo: req.headers['user-agent'] ?? null,
    }))
    return res.status(201).json(record)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// ---- Fichar por PIN en terminal fijo (público, sin sesión) -----------------

publicRouter.post('/clock-pin', async (req, res) => {
  const { clinic_id, dni_nie, pin, record_type } = req.body
  try {
    if (!clinic_id || !dni_nie || !pin) return res.status(400).json({ error: 'Faltan datos' })
    if (!['entrada', 'salida', 'inicio_pausa', 'fin_pausa'].includes(record_type)) {
      return res.status(400).json({ error: 'Tipo de fichaje no válido' })
    }
    // El kiosco de PIN no lleva sesión de usuario (no hay JWT que comprobar
    // con requireModuleAccess), así que el plan se verifica aquí directamente
    // contra el de la clínica indicada en el body.
    const clinicPlan = await queryOne<{ plan: string | null }>('SELECT plan FROM clinics WHERE id = $1', [clinic_id])
    const clinicPerms = clinicPlan?.plan ? await getPlanPermissions(clinicPlan.plan) : null
    if (!clinicPerms?.['time-tracking']) {
      return res.status(403).json({ error: 'El control horario no está incluido en el plan de esta clínica' })
    }
    const employee = await queryOne<{ id: string; pin_hash: string | null; active: boolean; full_name: string }>(
      'SELECT id, pin_hash, active, full_name FROM employees WHERE clinic_id = $1 AND upper(dni_nie) = upper($2)',
      [clinic_id, String(dni_nie).trim()]
    )
    if (!employee?.pin_hash) return res.status(401).json({ error: 'PIN incorrecto' })
    if (!employee.active) return res.status(403).json({ error: 'Empleado inactivo' })
    const valid = await bcrypt.compare(String(pin), employee.pin_hash)
    if (!valid) return res.status(401).json({ error: 'PIN incorrecto' })
    const record = await withTransaction(client => insertClockRecord(client, {
      clinicId: clinic_id, employeeId: employee.id, recordType: record_type, method: 'pin',
      latitude: null, longitude: null, ipAddress: req.ip ?? null, deviceInfo: req.headers['user-agent'] ?? null,
    }))
    return res.status(201).json({ ...record, employee_name: employee.full_name })
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// ---- Consulta de fichajes ---------------------------------------------------

router.get('/records', async (req, res) => {
  const { userId } = (req as any).user
  const { employee_id, date_from, date_to } = req.query
  try {
    const me = await getUser(userId)
    if (!me?.clinic_id) return res.json([])
    const isManager = MANAGER_ROLES.includes(me.role)
    let targetEmployeeId = employee_id as string | undefined
    if (!isManager) {
      const own = await ownEmployee(userId, me.clinic_id)
      if (!own) return res.json([])
      if (targetEmployeeId && targetEmployeeId !== own.id) return res.status(403).json({ error: 'No puedes ver fichajes de otro empleado' })
      targetEmployeeId = own.id
    } else if (targetEmployeeId && !(await belongsToClinic('employees', targetEmployeeId, me.clinic_id))) {
      return res.status(404).json({ error: 'Empleado no encontrado' })
    }

    let sql = `SELECT r.*,
        (SELECT row_to_json(x) FROM (
           SELECT reason, old_timestamp, new_timestamp, created_at FROM time_record_edits WHERE original_record_id = r.id ORDER BY created_at DESC LIMIT 1
         ) x) AS latest_edit
       FROM time_records r WHERE r.clinic_id = $1`
    const params: any[] = [me.clinic_id]
    if (targetEmployeeId) { params.push(targetEmployeeId); sql += ` AND r.employee_id = $${params.length}` }
    if (date_from) { params.push(date_from); sql += ` AND r.timestamp_utc >= $${params.length}` }
    if (date_to)   { params.push(date_to);   sql += ` AND r.timestamp_utc < $${params.length}::date + INTERVAL '1 day'` }
    sql += ' ORDER BY r.timestamp_utc DESC'

    const records = await query(sql, params)
    return res.json(records)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/timetracking/hours?employee_id&date_from&date_to — resumen de
// horas trabajadas por día, con horas extra por encima de 8h/día.
router.get('/hours', async (req, res) => {
  const { userId } = (req as any).user
  const { employee_id, date_from, date_to } = req.query
  try {
    const me = await getUser(userId)
    if (!me?.clinic_id) return res.json([])
    const isManager = MANAGER_ROLES.includes(me.role)
    let targetEmployeeId = employee_id as string | undefined
    if (!isManager) {
      const own = await ownEmployee(userId, me.clinic_id)
      if (!own) return res.json([])
      targetEmployeeId = own.id
    } else if (!targetEmployeeId) {
      return res.status(400).json({ error: 'employee_id requerido' })
    } else if (!(await belongsToClinic('employees', targetEmployeeId, me.clinic_id))) {
      return res.status(404).json({ error: 'Empleado no encontrado' })
    }

    let sql = `SELECT record_type, timestamp_utc FROM time_records WHERE clinic_id = $1 AND employee_id = $2`
    const params: any[] = [me.clinic_id, targetEmployeeId]
    if (date_from) { params.push(date_from); sql += ` AND timestamp_utc >= $${params.length}` }
    if (date_to)   { params.push(date_to);   sql += ` AND timestamp_utc < $${params.length}::date + INTERVAL '1 day'` }
    sql += ' ORDER BY timestamp_utc ASC'

    const records = await query<any>(sql, params)
    const days = computeWorkedHours(records)
    return res.json(days)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// ---- Corrección de un fichaje (nunca se edita el original) -----------------

router.post('/records/:id/correct', async (req, res) => {
  const { userId } = (req as any).user
  const { new_timestamp, reason } = req.body
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.status(403).json({ error: 'Solo el responsable de la clínica puede corregir fichajes' })
    if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'El motivo es obligatorio' })
    if (!new_timestamp) return res.status(400).json({ error: 'La nueva fecha/hora es obligatoria' })
    const original = await queryOne<{ id: string; timestamp_utc: string }>(
      'SELECT id, timestamp_utc FROM time_records WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId]
    )
    if (!original) return res.status(404).json({ error: 'Fichaje no encontrado' })
    const edit = await queryOne(
      `INSERT INTO time_record_edits (original_record_id, clinic_id, edited_by, reason, old_timestamp, new_timestamp)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [original.id, clinicId, userId, String(reason).trim(), original.timestamp_utc, new_timestamp]
    )
    return res.status(201).json(edit)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// ---- Incidencias: olvido de fichaje y ausencias -----------------------------
//
// Dos naturalezas distintas a propósito, ver migración 074:
// - olvido_entrada/olvido_salida: el día SÍ se trabajó, solo falta el
//   fichaje — al aprobarse se crea el registro que faltaba (method='manual').
// - ausencia_justificada/ausencia_injustificada/otro: el día NO se trabajó
//   (o no aplica) — al aprobarse NUNCA se crea un fichaje, para no simular
//   horas trabajadas que no existieron. Solo queda documentada.
//
// El empleado puede reportar sus propias incidencias, pero solo un
// responsable de la clínica puede resolverlas (aprobar/rechazar) — ningún
// empleado se autoaprueba, igual que las correcciones de fichajes.

const INCIDENT_TYPES = ['olvido_entrada', 'olvido_salida', 'ausencia_justificada', 'ausencia_injustificada', 'otro']
const FORGOTTEN_PUNCH_TYPES: Record<string, string> = { olvido_entrada: 'entrada', olvido_salida: 'salida' }

router.get('/incidents', async (req, res) => {
  const { userId } = (req as any).user
  const { employee_id, status } = req.query
  try {
    const me = await getUser(userId)
    if (!me?.clinic_id) return res.json([])
    const isManager = MANAGER_ROLES.includes(me.role)
    let targetEmployeeId = employee_id as string | undefined
    if (!isManager) {
      const own = await ownEmployee(userId, me.clinic_id)
      if (!own) return res.json([])
      targetEmployeeId = own.id
    } else if (targetEmployeeId && !(await belongsToClinic('employees', targetEmployeeId, me.clinic_id))) {
      return res.status(404).json({ error: 'Empleado no encontrado' })
    }

    let sql = `SELECT i.*, e.full_name AS employee_name
       FROM time_incidents i JOIN employees e ON e.id = i.employee_id
       WHERE i.clinic_id = $1`
    const params: any[] = [me.clinic_id]
    if (targetEmployeeId) { params.push(targetEmployeeId); sql += ` AND i.employee_id = $${params.length}` }
    if (status) { params.push(status); sql += ` AND i.status = $${params.length}` }
    sql += ' ORDER BY i.created_at DESC'

    return res.json(await query(sql, params))
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/incidents', async (req, res) => {
  const { userId } = (req as any).user
  const { employee_id, incident_type, proposed_timestamp, date_from, date_to, reason } = req.body
  try {
    const me = await getUser(userId)
    if (!me?.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const isManager = MANAGER_ROLES.includes(me.role)

    let targetEmployeeId: string
    if (isManager) {
      if (!employee_id) return res.status(400).json({ error: 'employee_id requerido' })
      if (!(await belongsToClinic('employees', employee_id, me.clinic_id))) return res.status(404).json({ error: 'Empleado no encontrado' })
      targetEmployeeId = employee_id
    } else {
      const own = await ownEmployee(userId, me.clinic_id)
      if (!own) return res.status(404).json({ error: 'No hay un empleado de fichaje vinculado a tu usuario' })
      targetEmployeeId = own.id
    }

    if (!INCIDENT_TYPES.includes(incident_type)) return res.status(400).json({ error: 'Tipo de incidencia no válido' })
    if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'El motivo es obligatorio' })
    if (incident_type in FORGOTTEN_PUNCH_TYPES && !proposed_timestamp) {
      return res.status(400).json({ error: 'Indica la fecha/hora en la que ocurrió el fichaje olvidado' })
    }
    if (incident_type.startsWith('ausencia') && !date_from) {
      return res.status(400).json({ error: 'Indica la fecha (o rango) de la ausencia' })
    }

    const incident = await queryOne(
      `INSERT INTO time_incidents (clinic_id, employee_id, incident_type, proposed_timestamp, date_from, date_to, reason, reported_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        me.clinic_id, targetEmployeeId, incident_type,
        incident_type in FORGOTTEN_PUNCH_TYPES ? proposed_timestamp : null,
        incident_type.startsWith('ausencia') ? date_from : null,
        incident_type.startsWith('ausencia') ? (date_to || date_from) : null,
        String(reason).trim(), userId,
      ]
    )
    return res.status(201).json(incident)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

router.post('/incidents/:id/resolve', async (req, res) => {
  const { userId } = (req as any).user
  const { approve, resolution_notes } = req.body
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.status(403).json({ error: 'Solo el responsable de la clínica puede resolver incidencias' })
    const incident = await queryOne<any>(
      'SELECT * FROM time_incidents WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId]
    )
    if (!incident) return res.status(404).json({ error: 'Incidencia no encontrada' })
    if (incident.status !== 'pendiente') return res.status(400).json({ error: 'Esta incidencia ya ha sido resuelta' })

    let createdRecordId: string | null = null
    if (approve) {
      const forgottenType = FORGOTTEN_PUNCH_TYPES[incident.incident_type]
      if (forgottenType) {
        // Olvido de fichaje: SÍ se crea el registro que faltaba, con la
        // hora propuesta y aprobada — encadenado igual que cualquier otro,
        // marcado como 'manual' para distinguirlo de un fichaje en vivo.
        const record = await withTransaction(client => insertClockRecord(client, {
          clinicId, employeeId: incident.employee_id, recordType: forgottenType, method: 'manual',
          latitude: null, longitude: null, ipAddress: null, deviceInfo: null,
          timestampUtc: incident.proposed_timestamp,
        }))
        createdRecordId = record.id
      }
      // Ausencias y "otro": nunca se crea un fichaje — ver nota de diseño arriba.
    }

    const resolved = await queryOne(
      `UPDATE time_incidents SET
         status = $1, resolved_by = $2, resolved_at = NOW(), resolution_notes = $3, created_record_id = $4
       WHERE id = $5 RETURNING *`,
      [approve ? 'aprobada' : 'rechazada', userId, resolution_notes ?? null, createdRecordId, incident.id]
    )
    return res.json(resolved)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// ---- Compensación de horas extra --------------------------------------------

router.get('/overtime', async (req, res) => {
  const { userId } = (req as any).user
  const { employee_id } = req.query
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.status(403).json({ error: 'Solo el responsable de la clínica puede ver esto' })
    let sql = 'SELECT * FROM overtime_compensations WHERE clinic_id = $1'
    const params: any[] = [clinicId]
    if (employee_id) { params.push(employee_id); sql += ` AND employee_id = $${params.length}` }
    sql += ' ORDER BY period_start DESC'
    return res.json(await query(sql, params))
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/overtime', async (req, res) => {
  const { userId } = (req as any).user
  const { employee_id, period_start, period_end, compensation_type, notes } = req.body
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.status(403).json({ error: 'Solo el responsable de la clínica puede editar esto' })
    if (!(await belongsToClinic('employees', employee_id, clinicId))) return res.status(404).json({ error: 'Empleado no encontrado' })
    if (!['economica', 'descanso'].includes(compensation_type)) return res.status(400).json({ error: 'Tipo de compensación no válido' })
    const row = await queryOne(
      `INSERT INTO overtime_compensations (clinic_id, employee_id, period_start, period_end, compensation_type, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [clinicId, employee_id, period_start, period_end, compensation_type, notes ?? null, userId]
    )
    return res.status(201).json(row)
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// ---- Integridad --------------------------------------------------------------

router.get('/integrity/check', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await requireManager(userId)
    if (!clinicId) return res.json({ ok: true, issues: [] })
    const issues = await verifyClinicTimeChain(clinicId)
    return res.json({ ok: issues.length === 0, issues })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// ---- Exportación verificable -------------------------------------------------

router.get('/export', async (req, res) => {
  const { userId } = (req as any).user
  const { employee_id, date_from, date_to } = req.query
  try {
    const me = await getUser(userId)
    if (!me?.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })
    const isManager = MANAGER_ROLES.includes(me.role)
    let targetEmployeeId = employee_id as string | undefined
    if (!isManager) {
      const own = await ownEmployee(userId, me.clinic_id)
      if (!own) return res.status(404).json({ error: 'No hay un empleado vinculado a tu usuario' })
      targetEmployeeId = own.id
    } else if (!targetEmployeeId) {
      return res.status(400).json({ error: 'employee_id requerido' })
    } else if (!(await belongsToClinic('employees', targetEmployeeId, me.clinic_id))) {
      return res.status(404).json({ error: 'Empleado no encontrado' })
    }

    const employee = await queryOne('SELECT id, full_name, dni_nie, role FROM employees WHERE id = $1', [targetEmployeeId])
    const clinic = await queryOne('SELECT name, legal_name, tax_id FROM clinics WHERE id = $1', [me.clinic_id])

    let sql = 'SELECT record_type, timestamp_utc, method FROM time_records WHERE clinic_id = $1 AND employee_id = $2'
    const params: any[] = [me.clinic_id, targetEmployeeId]
    if (date_from) { params.push(date_from); sql += ` AND timestamp_utc >= $${params.length}` }
    if (date_to)   { params.push(date_to);   sql += ` AND timestamp_utc < $${params.length}::date + INTERVAL '1 day'` }
    sql += ' ORDER BY timestamp_utc ASC'
    const records = await query<any>(sql, params)
    const days = computeWorkedHours(records)
    const totalHours = Math.round(days.reduce((s, d) => s + d.hours, 0) * 100) / 100

    // Hash resumen de integridad del conjunto exportado — permite comprobar
    // a posteriori que un PDF/CSV exportado no se ha alterado, sin
    // necesidad de volver a consultar la base de datos.
    const summaryPayload = JSON.stringify({ employeeId: targetEmployeeId, records, days, totalHours })
    const exportHash = crypto.createHash('sha256').update(summaryPayload).digest('hex')

    return res.json({ employee, clinic, period: { date_from: date_from ?? null, date_to: date_to ?? null }, records, days, totalHours, exportHash })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
