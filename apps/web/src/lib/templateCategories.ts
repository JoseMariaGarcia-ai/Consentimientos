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

// Categoría sintética, solo para agrupar/mostrar — no es un valor real de
// category/extraCategories (no aparece en TEMPLATE_CATEGORIES). Los
// favoritos ("Más usados", marcados con la estrella en Plantillas) se
// guardan aparte, aislados por clínica (clinic_template_favorites, ver
// migración 088), y se reflejan en template.isFavorite. Se muestra
// siempre la primera al elegir tratamiento.
export const FAVORITE_CATEGORY = 'mas_usados'
