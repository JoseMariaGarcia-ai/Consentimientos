import { useState, useEffect } from 'react'

const TOKEN_KEY = 'cp_token'
const EMAIL_KEY = 'cp_email'
const ROLE_KEY  = 'cp_role'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRole(): string | null {
  return localStorage.getItem(ROLE_KEY)
}

export function saveSession(token: string, email: string, role?: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EMAIL_KEY, email)
  if (role) localStorage.setItem(ROLE_KEY, role)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export function getEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY)
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getToken())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setToken(getToken())
  }, [])

  const login = (t: string, email: string, role?: string) => {
    saveSession(t, email, role)
    setToken(t)
  }

  const logout = () => {
    clearSession()
    setToken(null)
  }

  return { token, loading, setLoading, login, logout, isAuthenticated: !!token, role: getRole() }
}
