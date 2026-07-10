-- Categorías para organizar las plantillas de consentimientos por especialidad
-- (Medicina Estética, Odontología, Veterinaria, Centro Estético, Salón de
-- Belleza, Tatuajes, Fisioterapia). Las 20 plantillas existentes son todas
-- de Medicina Estética, así que ese es el valor por defecto que las
-- reclasifica automáticamente al añadir la columna.
ALTER TABLE consent_templates
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'medicina_estetica'
  CHECK (category IN (
    'medicina_estetica',
    'odontologia',
    'veterinaria',
    'centro_estetico',
    'salon_belleza',
    'tatuajes',
    'fisioterapia'
  ));

CREATE INDEX IF NOT EXISTS idx_consent_templates_category ON consent_templates(category);
