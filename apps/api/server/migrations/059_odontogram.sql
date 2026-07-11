-- Odontograma — módulo independiente para registrar el estado de cada
-- diente (por cara) en cada visita, y reconstruir la evolución de la boca
-- del paciente comparando visitas.
--
-- Diseño: cada visita es un registro completo e inmutable en formato JSONB
-- (mismo patrón que toxin_records.treated_zones) en lugar de tablas
-- normalizadas por diente/cara — evita joins innecesarios y encaja de forma
-- natural con el requisito de "cada visita crea un nuevo registro completo,
-- nunca se sobrescribe el anterior": una fila = una fotografía completa de
-- la boca en un momento dado.
--
-- Notación FDI/ISO 3950 (dos dígitos, primer dígito = cuadrante):
--   Permanente: 11-18, 21-28, 31-38, 41-48
--   Temporal:   51-55, 61-65, 71-75, 81-85

CREATE TABLE IF NOT EXISTS odontogram_records (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id      UUID REFERENCES doctors(id) ON DELETE SET NULL,
  record_date    TIMESTAMPTZ NOT NULL,
  dentition_type TEXT NOT NULL CHECK (dentition_type IN ('permanente', 'temporal', 'mixta')),
  -- [{ "number": "16", "status": "sano", "material": null, "notes": "",
  --    "faces": { "vestibular": {"condition":"sana","material":null},
  --               "lingual_palatina": {...}, "mesial": {...}, "distal": {...},
  --               "oclusal_incisal": {...} } }, ...]
  -- status: sano | ausente | extraido | a_extraer | implante | corona |
  --         puente | endodoncia | movil | incluido | temporal_presente
  -- face.condition: sana | caries | obturada | sellante | fractura | desgaste
  -- face.material: composite | amalgama | ceramica | resina | null
  teeth          JSONB NOT NULL DEFAULT '[]',
  notes          TEXT,
  created_by     UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_odontogram_clinic   ON odontogram_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_odontogram_patient   ON odontogram_records(patient_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_odontogram_doctor    ON odontogram_records(doctor_id);

ALTER TABLE odontogram_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service key full access on odontogram_records" ON odontogram_records;
CREATE POLICY "Service key full access on odontogram_records" ON odontogram_records FOR ALL USING (true);
