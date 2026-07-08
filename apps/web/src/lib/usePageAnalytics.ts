import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { getToken } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''
const SESSION_KEY_STORAGE = 'cp_analytics_sid'

function getSessionKey(): string {
  let key = localStorage.getItem(SESSION_KEY_STORAGE)
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY_STORAGE, key)
  }
  return key
}

// Tracks every route change across the whole app — the public landing page
// and the authenticated app alike — so superadmins get real visit/duration
// analytics without wiring per-page instrumentation.
export function usePageAnalytics() {
  const location = useLocation()
  const current = useRef<{ id: string; start: number } | null>(null)

  useEffect(() => {
    const path = location.pathname + location.search

    // Flush the previous page's time-on-page before switching to the new one.
    flushCurrent()

    const token = getToken()
    fetch(`${BASE_URL}/analytics/pageview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        session_key: getSessionKey(),
        path,
        title: document.title,
        referrer: document.referrer || undefined,
      }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.id) current.current = { id: data.id, start: Date.now() }
      })
      .catch(() => {})

    return () => { flushCurrent() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search])

  useEffect(() => {
    const onHide = () => flushCurrent()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide()
    })
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
    }
  }, [])

  function flushCurrent() {
    if (!current.current) return
    const { id, start } = current.current
    const duration_ms = Date.now() - start
    current.current = null
    const blob = new Blob([JSON.stringify({ duration_ms })], { type: 'application/json' })
    navigator.sendBeacon?.(`${BASE_URL}/analytics/pageview/${id}/duration`, blob)
  }
}
