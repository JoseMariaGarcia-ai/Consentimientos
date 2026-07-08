const DEVICE_TOKEN_KEY = 'cp_device_token'
const DEVICE_CLINIC_KEY = 'cp_device_clinic_name'

export function getDeviceToken(): string | null {
  return localStorage.getItem(DEVICE_TOKEN_KEY)
}

export function saveDeviceSession(token: string, clinicName: string) {
  localStorage.setItem(DEVICE_TOKEN_KEY, token)
  localStorage.setItem(DEVICE_CLINIC_KEY, clinicName)
}

export function getDeviceClinicName(): string | null {
  return localStorage.getItem(DEVICE_CLINIC_KEY)
}

export function clearDeviceSession() {
  localStorage.removeItem(DEVICE_TOKEN_KEY)
  localStorage.removeItem(DEVICE_CLINIC_KEY)
}

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

function deviceHeaders(): Record<string, string> {
  const token = getDeviceToken()
  return token ? { 'X-Device-Token': token } : {}
}

async function handleResponse(r: Response) {
  const data = await r.json().catch(() => null)
  if (!r.ok) throw new Error(data?.error ?? r.statusText)
  return data
}

// Separate client from `api` — a signing tablet never carries a user JWT,
// only its own device token, so it can't reuse the normal Authorization flow.
export const deviceApi = {
  get: (path: string) =>
    fetch(`${BASE_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...deviceHeaders() } }).then(handleResponse),

  post: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...deviceHeaders() },
      body: JSON.stringify(body),
    }).then(handleResponse),
}
