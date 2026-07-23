export const TEMPLATE_CATEGORIES = [
  'medicina_estetica',
  'odontologia',
  'dermatologia',
  'cirugia_plastica',
  'ginecologia_estetica',
  'capilar',
  'podologia',
  'centro_estetico',
  'salon_belleza',
  'tatuajes',
  'veterinaria',
  'fisioterapia',
  'osteopatia',
  'reproduccion_asistida',
  'laboratorio_clinico',
] as const

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]

// Categoría especial, no elegible como categoría principal de una
// plantilla (no aparece en TEMPLATE_CATEGORIES) — se guarda igual que
// cualquier otra en extraCategories, marcada con la estrella en
// Plantillas, y se muestra siempre la primera al elegir tratamiento.
export const FAVORITE_CATEGORY = 'mas_usados'
