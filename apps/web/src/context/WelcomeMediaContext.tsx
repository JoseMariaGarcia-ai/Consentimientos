import { createContext, useContext, useRef, useCallback } from 'react'

type TriggerEvent = 'consent' | 'clinical'
type TriggerHandler = (event: TriggerEvent) => void

interface WelcomeMediaContextValue {
  trigger: (event: TriggerEvent) => void
  registerTrigger: (fn: TriggerHandler) => () => void
}

const WelcomeMediaContext = createContext<WelcomeMediaContextValue>({
  trigger: () => {},
  registerTrigger: () => () => {},
})

// Varios oyentes independientes pueden reaccionar al mismo evento (medios
// de bienvenida del laboratorio, campañas publicitarias, etc.) — antes solo
// se guardaba un único handler, así que el último en registrarse pisaba a
// los demás y dejaba de disparar los anteriores.
export function WelcomeMediaProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef<TriggerHandler[]>([])

  const registerTrigger = useCallback((fn: TriggerHandler) => {
    handlersRef.current.push(fn)
    return () => { handlersRef.current = handlersRef.current.filter(h => h !== fn) }
  }, [])

  const trigger = useCallback((event: TriggerEvent) => {
    handlersRef.current.forEach(fn => fn(event))
  }, [])

  return (
    <WelcomeMediaContext.Provider value={{ trigger, registerTrigger }}>
      {children}
    </WelcomeMediaContext.Provider>
  )
}

export const useWelcomeMedia = () => useContext(WelcomeMediaContext)
