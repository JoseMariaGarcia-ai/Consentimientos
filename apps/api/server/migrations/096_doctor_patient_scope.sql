-- Segundo permiso independiente del doctor (además de can_view_all_agendas):
-- ver todos los pacientes de la clínica —y sus consentimientos, historias,
-- fotos, toxina y odontogramas— o solo los suyos propios. "Suyo" se define
-- como cualquier paciente con el que el doctor tenga al menos un registro
-- clínico (cita, consentimiento, historia, sesión de fotos, toxina,
-- odontograma) o que él mismo haya dado de alta — ver ownPatientIdsSubquery
-- en lib/doctorScope.ts. created_by_doctor_id cubre el caso de un paciente
-- recién creado por un doctor restringido que todavía no tiene ningún otro
-- registro asociado.
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS can_view_all_patients BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patients_created_by_doctor ON patients(created_by_doctor_id);
