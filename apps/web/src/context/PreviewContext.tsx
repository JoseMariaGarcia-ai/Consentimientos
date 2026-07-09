import { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type PreviewRole = 'patient' | 'clinica' | 'lab_partner'

interface PreviewState {
  role: PreviewRole
  patientId?: string
  labId?: string
  clinicaModules?: string[]
  clinicaPlan?: string
}

interface PreviewContextValue {
  preview: PreviewState | null
  enterPreview: (state: PreviewState) => void
  exitPreview: () => void
}

const STORAGE_KEY = 'cp_preview_role'

const PreviewContext = createContext<PreviewContextValue | null>(null)

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState<PreviewState | null>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (preview) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preview))
    else sessionStorage.removeItem(STORAGE_KEY)
  }, [preview])

  const enterPreview = useCallback((state: PreviewState) => setPreview(state), [])
  const exitPreview = useCallback(() => setPreview(null), [])

  return (
    <PreviewContext.Provider value={{ preview, enterPreview, exitPreview }}>
      {children}
    </PreviewContext.Provider>
  )
}

export function usePreview() {
  const ctx = useContext(PreviewContext)
  if (!ctx) throw new Error('usePreview must be used within PreviewProvider')
  return ctx
}
