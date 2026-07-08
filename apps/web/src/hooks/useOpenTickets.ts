import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export function useOpenTickets() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/tickets/open-count')
      setCount(data?.count ?? 0)
    } catch {
      // ignore auth errors on load
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { count, loading, refresh }
}
