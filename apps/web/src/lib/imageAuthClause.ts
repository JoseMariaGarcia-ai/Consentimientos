// Detecta si el cuerpo legal de la plantilla incluye la cláusula estándar
// de autorización de uso de imágenes (ver migración
// 014_image_session_clause.sql) — el texto exacto varía ligeramente entre
// plantillas ("formativos o científicos" / solo "formativos", etc.), así
// que se busca por palabras clave en vez de una frase exacta.
const AUTHORIZATION_PHRASE = /autorizo el uso de mis im[aá]genes/i
const EDUCATIONAL_KEYWORDS = /(formativ|cient[ií]fic)/i
const MARKETING_KEYWORDS = /(publicitario|difusi[oó]n)/i

export function hasEducationalImageClause(bodyHtml: string): boolean {
  return AUTHORIZATION_PHRASE.test(bodyHtml) && EDUCATIONAL_KEYWORDS.test(bodyHtml)
}

export function hasMarketingImageClause(bodyHtml: string): boolean {
  return AUTHORIZATION_PHRASE.test(bodyHtml) && MARKETING_KEYWORDS.test(bodyHtml)
}
