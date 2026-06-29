import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { useWelcomeMedia } from '@/context/WelcomeMediaContext'

const LS_LAST_SHOWN = 'welcome_media_last_shown'
const SS_SESSION    = 'welcome_media_shown_session'

export function WelcomeMediaModal() {
  const [media, setMedia]     = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { registerTrigger } = useWelcomeMedia()

  const show = useCallback((m: any) => {
    setMedia(m)
    setVisible(true)
    localStorage.setItem(LS_LAST_SHOWN, Date.now().toString())
  }, [])

  const shouldShow = useCallback((m: any): boolean => {
    const trigger: string = m.show_trigger ?? 'session'
    if (trigger === 'session') {
      return !sessionStorage.getItem(SS_SESSION)
    }
    if (trigger === 'interval') {
      const mins   = Math.max(1, m.show_interval_minutes ?? 30)
      const last   = parseInt(localStorage.getItem(LS_LAST_SHOWN) ?? '0')
      const elapsed = (Date.now() - last) / 60000
      return elapsed >= mins
    }
    // 'consent' and 'clinical' are handled by external triggers only
    return false
  }, [])

  useEffect(() => {
    api.get('/media').then((data: any) => {
      const m = data?.welcome
      if (!m) return
      if (shouldShow(m)) {
        show(m)
        if (m.show_trigger === 'session') sessionStorage.setItem(SS_SESSION, '1')
      }

      // Register external trigger (consent / clinical)
      registerTrigger((event: 'consent' | 'clinical') => {
        const trigger = m.show_trigger
        if (trigger === 'consent' && event === 'consent') show(m)
        if (trigger === 'clinical' && event === 'clinical') show(m)
      })

      // Interval: set up a timer to re-check
      if (m.show_trigger === 'interval') {
        const mins = Math.max(1, m.show_interval_minutes ?? 30)
        const id = setInterval(() => {
          if (shouldShow(m)) show(m)
        }, mins * 60 * 1000)
        return () => clearInterval(id)
      }
    }).catch(() => {})
  }, [])

  const close = () => {
    setVisible(false)
    videoRef.current?.pause()
  }

  if (!visible || !media) return null

  const isVideo = media.content_type?.startsWith('video')

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isVideo ? (
          <video
            ref={videoRef}
            src={media.url}
            autoPlay
            controls
            playsInline
            className="w-full max-h-[80vh] object-contain"
            onEnded={close}
          />
        ) : (
          <img
            src={media.url}
            alt="Bienvenida"
            className="w-full max-h-[80vh] object-contain"
          />
        )}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <button
            onClick={close}
            className="px-5 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-colors"
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  )
}
