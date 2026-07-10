export const TEMPLATE_CATEGORIES = [
  'medicina_estetica',
  'odontologia',
  'dermatologia',
  'cirugia_plastica',
  'capilar',
  'podologia',
  'centro_estetico',
  'salon_belleza',
  'tatuajes',
  'veterinaria',
  'fisioterapia',
  'reproduccion_asistida',
] as const

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]
