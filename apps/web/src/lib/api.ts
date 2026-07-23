import { getToken } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Si el servidor (o un proxy delante, o el límite de tamaño de Express)
// devuelve un error cuyo cuerpo no es JSON — un 413 Payload Too Large en
// texto plano, una página de error HTML, etc. — r.json() lanza su propia
// excepción genérica ANTES de que se pueda leer r.ok, y el mensaje que
// enseña cada navegador es distinto y poco claro (en Safari: "The string
// did not match the expected pattern.", sin ninguna pista del problema
// real). Se intenta como JSON primero (caso normal) y, si falla, se cae a
// texto plano para al menos dar un mensaje legible.
async function handleResponse(r: Response) {
  const raw = await r.text()
  let data: any
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    if (!r.ok) throw new Error(raw?.trim() || r.statusText || `Error ${r.status}`)
    throw new Error(`Respuesta inesperada del servidor (no es JSON válido): ${raw.slice(0, 200)}`)
  }
  if (!r.ok) throw new Error(data.error ?? r.statusText)
  return data
}

export const api = {
  get: (path: string) =>
    fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    }).then(handleResponse),

  post: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handleResponse),

  put: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handleResponse),

  delete: (path: string) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    }).then(handleResponse),
}
