import { useState, useEffect } from 'react'

const TOKEN_KEY = 'cp_token'
const EMAIL_KEY = 'cp_email'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EMAIL_KEY, email)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
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

  const login = (t: string, email: string) => {
    saveSession(t, email)
    setToken(t)
  }

  const logout = () => {
    clearSession()
    setToken(null)
  }

  return { token, loading, setLoading, login, logout, isAuthenticated: !!token }
}
