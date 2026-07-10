-- Amplía las categorías permitidas para incluir 4 nuevas: podología,
-- dermatología médica, cirugía plástica y reproducción asistida.
ALTER TABLE consent_templates DROP CONSTRAINT consent_templates_category_check;
ALTER TABLE consent_templates ADD CONSTRAINT consent_templates_category_check
  CHECK (category IN (
    'medicina_estetica',
    'odontologia',
    'veterinaria',
    'centro_estetico',
    'salon_belleza',
    'tatuajes',
    'fisioterapia',
    'capilar',
    'podologia',
    'dermatologia',
    'cirugia_plastica',
    'reproduccion_asistida'
  ));

ALTER TABLE consent_templates DROP CONSTRAINT consent_templates_extra_categories_check;
ALTER TABLE consent_templates ADD CONSTRAINT consent_templates_extra_categories_check
  CHECK (extra_categories <@ ARRAY[
    'medicina_estetica',
    'odontologia',
    'veterinaria',
    'centro_estetico',
    'salon_belleza',
    'tatuajes',
    'fisioterapia',
    'capilar',
    'podologia',
    'dermatologia',
    'cirugia_plastica',
    'reproduccion_asistida'
  ]::TEXT[]);
