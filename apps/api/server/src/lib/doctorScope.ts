import { queryOne } from './db'

// Permiso independiente de can_view_all_agendas: si un doctor no puede "ver
// todos los pacientes", solo debe ver/tocar pacientes con los que tiene algún
// vínculo clínico (cita, consentimiento, historia, sesión de fotos, toxina,
// odontograma) o que él mismo dio de alta — nunca se confía en nada que
// llegue del cliente para decidir esto. Devuelve null si el solicitante no es
// un doctor restringido (clínica/admin/superadmin/recepción, o un doctor con
// el permiso activado, ven todo con normalidad); devuelve el doctors.id
// propio si hay que restringir; devuelve '' si es un doctor sin ficha de
// doctor vinculada todavía (no debe ver ni crear nada).
export async function resolvePatientDoctorScope(userId: string): Promise<string | null> {
  const me = await queryOne<{ role: string }>('SELECT role FROM app_users WHERE id = $1', [userId])
  if (me?.role !== 'doctor') return null
  const doctor = await queryOne<{ id: string; can_view_all_patients: boolean }>(
    'SELECT id, can_view_all_patients FROM doctors WHERE app_user_id = $1', [userId]
  )
  if (!doctor) return ''
  return doctor.can_view_all_patients ? null : doctor.id
}

// Subconsulta reutilizable: ids de paciente vinculados a un doctor concreto,
// a través de cualquier tabla clínica que registre doctor_id, más los
// pacientes que él mismo dio de alta. paramIndex debe apuntar al parámetro
// SQL ($N) que llevará el doctors.id — se repite varias veces en la misma
// subconsulta, node-postgres admite referenciar el mismo índice más de una vez.
export function ownPatientIdsSubquery(paramIndex: number): string {
  const p = `$${paramIndex}`
  return `(
    SELECT patient_id FROM appointments WHERE doctor_id = ${p}
    UNION SELECT patient_id FROM consent_records WHERE doctor_id = ${p}
    UNION SELECT patient_id FROM clinical_records WHERE doctor_id = ${p}
    UNION SELECT patient_id FROM photo_sessions WHERE doctor_id = ${p}
    UNION SELECT patient_id FROM toxin_records WHERE doctor_id = ${p}
    UNION SELECT patient_id FROM odontogram_records WHERE doctor_id = ${p}
    UNION SELECT id FROM patients WHERE created_by_doctor_id = ${p}
  )`
}

// Comprueba si un paciente concreto está dentro del scope de un doctor
// restringido — para los POST de consentimientos/historias/fotos/toxina/
// odontogramas, que necesitan verificar el paciente antes de crear el
// registro (el paciente ya se comprobó que pertenece a la clínica aparte).
export async function patientInScope(patientId: string, doctorScope: string): Promise<boolean> {
  const row = await queryOne(`SELECT 1 AS x WHERE $1 IN ${ownPatientIdsSubquery(2)}`, [patientId, doctorScope])
  return !!row
}
