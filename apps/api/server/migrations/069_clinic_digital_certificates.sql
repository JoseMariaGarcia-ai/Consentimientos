-- Certificado digital de cada clínica para la comunicación obligatoria a la
-- AEAT en modalidad VERI*FACTU (RD 1007/2023, Orden HAC/1177/2024). Cada
-- clínica es titular fiscal de sus propias facturas, así que cada una debe
-- aportar y usar su PROPIO certificado — no existe un certificado único de
-- ConsentsPro. Ver src/lib/certificateEncryption.ts y
-- src/routes/clinicCertificates.ts.
--
-- REGLA DE ORO: el archivo del certificado y su contraseña son el dato más
-- sensible de todo el sistema — equivalen a la firma legal plena de la
-- clínica ante la AEAT. Se cifran en reposo con AES-256-GCM usando DOS
-- claves distintas (una para el archivo, otra para la contraseña — nunca la
-- misma clave para ambos) y no deben poder leerse en texto plano desde
-- ninguna consulta directa a la base de datos ni exponerse/descargarse
-- desde el frontend en ningún momento tras la subida.
CREATE TABLE IF NOT EXISTS clinic_digital_certificates (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- NULL únicamente para el certificado de prueba a nivel de sistema
  -- (environment='test', ver comprobación 6.3/6.4 del documento de
  -- ampliación) — un certificado real de clínica siempre lleva clinic_id.
  clinic_id                       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  environment                     TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'test')),
  certificate_encrypted            BYTEA NOT NULL, -- archivo .p12/.pfx cifrado, AES-256-GCM
  certificate_iv                   TEXT NOT NULL,
  certificate_auth_tag             TEXT NOT NULL,
  certificate_password_encrypted    TEXT NOT NULL, -- cifrada por separado, clave distinta a la del archivo
  certificate_password_iv           TEXT NOT NULL,
  certificate_password_auth_tag      TEXT NOT NULL,
  issuer                            TEXT, -- entidad emisora, ej. "FNMT-RCM"
  subject_name                      TEXT, -- titular tal como consta en el certificado
  valid_from                        DATE NOT NULL,
  valid_until                       DATE NOT NULL,
  status                            TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'caducado', 'revocado', 'historico')),
  uploaded_by                       UUID NOT NULL REFERENCES app_users(id),
  uploaded_at                       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at                      TIMESTAMPTZ,
  -- Evitan reenviar el mismo aviso de caducidad cada día una vez enviado.
  notified_30d_at                   TIMESTAMPTZ,
  notified_15d_at                   TIMESTAMPTZ,
  notified_expiry_at                TIMESTAMPTZ,
  CONSTRAINT clinic_cert_test_or_clinic CHECK (environment = 'test' OR clinic_id IS NOT NULL)
);

-- Un certificado 'activo' por clínica (los sustituidos pasan a 'historico',
-- nunca se borran). El test del sistema es una fila con clinic_id NULL,
-- también única mientras esté activa.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_cert_active_per_clinic
  ON clinic_digital_certificates (clinic_id)
  WHERE status = 'activo' AND clinic_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_cert_active_system_test
  ON clinic_digital_certificates ((clinic_id IS NULL))
  WHERE status = 'activo' AND clinic_id IS NULL AND environment = 'test';

CREATE INDEX IF NOT EXISTS idx_clinic_cert_clinic ON clinic_digital_certificates(clinic_id);

CREATE TABLE IF NOT EXISTS certificate_access_log (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id      UUID REFERENCES clinics(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES clinic_digital_certificates(id),
  action         TEXT NOT NULL CHECK (action IN ('subida', 'uso_para_firma', 'renovacion', 'eliminacion', 'bloqueo_cruzado')),
  invoice_id     UUID REFERENCES invoices(id), -- si el acceso fue para firmar una factura concreta
  performed_by   UUID REFERENCES app_users(id),
  ip_address     TEXT,
  detail         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_log_clinic ON certificate_access_log(clinic_id, created_at DESC);

ALTER TABLE clinic_digital_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_access_log      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on clinic_digital_certificates" ON clinic_digital_certificates;
DROP POLICY IF EXISTS "Service key full access on certificate_access_log"      ON certificate_access_log;
CREATE POLICY "Service key full access on clinic_digital_certificates" ON clinic_digital_certificates FOR ALL USING (true);
CREATE POLICY "Service key full access on certificate_access_log"      ON certificate_access_log      FOR ALL USING (true);
