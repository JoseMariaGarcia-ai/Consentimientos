import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
}

export const api = {
  get: async (path: string) => {
    const auth = await getAuthHeader()
    return fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...auth },
      credentials: 'include',
    }).then(r => r.json())
  },
  post: async (path: string, body: unknown) => {
    const auth = await getAuthHeader()
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(body),
      credentials: 'include',
    }).then(r => r.json())
  },
  put: async (path: string, body: unknown) => {
    const auth = await getAuthHeader()
    return fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(body),
      credentials: 'include',
    }).then(r => r.json())
  },
  delete: async (path: string) => {
    const auth = await getAuthHeader()
    return fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...auth },
      credentials: 'include',
    }).then(r => r.json())
  },
}
