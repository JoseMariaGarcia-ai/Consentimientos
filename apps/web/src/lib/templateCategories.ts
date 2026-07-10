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
