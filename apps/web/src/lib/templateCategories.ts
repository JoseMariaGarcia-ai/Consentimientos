export const TEMPLATE_CATEGORIES = [
  'medicina_estetica',
  'odontologia',
  'centro_estetico',
  'salon_belleza',
  'tatuajes',
  'veterinaria',
  'fisioterapia',
] as const

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]
