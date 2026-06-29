import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface Credits {
  consents_available: number
  clinical_records_available: number
  photo_sessions_available: number
}

export function useCredits() {
  const [credits, setCredits] = useState<Credits | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/credits')
      setCredits(data)
    } catch {
      // ignore auth errors on load
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [])

  const low = credits
    ? credits.consents_available <= 5 ||
      credits.clinical_records_available <= 5 ||
      credits.photo_sessions_available <= 5
    : false

  return { credits, loading, low, refresh }
}
