import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

// Sondeado (no solo al cargar) porque estos contadores del menú lateral
// deben reflejar mensajes de WhatsApp que lleguen mientras la app está
// abierta en otra pantalla, igual que el propio panel de WhatsApp.
const POLL_MS = 20000

export function useWhatsAppUnread() {
  const [adminUnread, setAdminUnread] = useState(0)
  const [clinicsUnread, setClinicsUnread] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/whatsapp/unread-summary')
      setAdminUnread(data?.adminUnread ?? 0)
      setClinicsUnread(data?.clinicsUnread ?? 0)
    } catch {
      // ignore auth errors on load
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  return { adminUnread, clinicsUnread }
}
