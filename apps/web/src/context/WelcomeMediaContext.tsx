import { createContext, useContext, useRef, useCallback } from 'react'

interface WelcomeMediaContextValue {
  trigger: (event: 'consent' | 'clinical') => void
  registerTrigger: (fn: (event: 'consent' | 'clinical') => void) => void
}

const WelcomeMediaContext = createContext<WelcomeMediaContextValue>({
  trigger: () => {},
  registerTrigger: () => {},
})

export function WelcomeMediaProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = useRef<((event: 'consent' | 'clinical') => void) | null>(null)

  const registerTrigger = useCallback((fn: (event: 'consent' | 'clinical') => void) => {
    handlerRef.current = fn
  }, [])

  const trigger = useCallback((event: 'consent' | 'clinical') => {
    handlerRef.current?.(event)
  }, [])

  return (
    <WelcomeMediaContext.Provider value={{ trigger, registerTrigger }}>
      {children}
    </WelcomeMediaContext.Provider>
  )
}

export const useWelcomeMedia = () => useContext(WelcomeMediaContext)
