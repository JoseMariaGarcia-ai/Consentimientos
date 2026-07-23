-- "Más usados" (sección Plantillas: estrella junto a cada tratamiento) se
-- guarda igual que cualquier otra categoría extra, en extra_categories —
-- pero esa columna tiene un CHECK que limita los valores permitidos a la
-- lista fija de categorías reales (ver 040/042/047/052), así que sin
-- ampliarlo aquí, marcar una plantilla como favorita fallaría con una
-- violación de constraint.
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
    'reproduccion_asistida',
    'osteopatia',
    'ginecologia_estetica',
    'laboratorio_clinico',
    'mas_usados'
  ]::TEXT[]);
