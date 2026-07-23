-- "Más usados" (estrella en Plantillas) es una preferencia AISLADA por
-- clínica, no una propiedad de la plantilla en sí — las plantillas son
-- globales y compartidas (clinic_id NULL, gestionadas por superadmin), así
-- que no se puede guardar como una categoría extra del propio registro
-- (eso lo vería y compartiría toda la plataforma). Tabla de unión aparte:
-- cada fila es "esta clínica ha marcado esta plantilla como favorita".
CREATE TABLE IF NOT EXISTS clinic_template_favorites (
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES consent_templates(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clinic_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_clinic_template_favorites_clinic ON clinic_template_favorites(clinic_id);
