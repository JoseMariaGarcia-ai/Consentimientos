import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { useWelcomeMedia } from '@/context/WelcomeMediaContext'

const LS_LAST_SHOWN   = 'welcome_media_last_shown'
const LS_SEQ_INDEX    = 'welcome_media_seq_index'
const SS_SESSION      = 'welcome_media_shown_session'

interface Creative {
  id: string
  url: string
  content_type: string
  original_name: string
}

interface SlotData {
  settings: {
    show_trigger: string
    show_interval_minutes: number
    display_mode: 'manual' | 'random' | 'sequential'
    active_creative_id: string | null
  }
  files: Creative[]
}

function pickCreative(slot: SlotData): Creative | null {
  const { files, settings } = slot
  if (!files.length) return null

  if (settings.display_mode === 'manual') {
    return files.find(f => f.id === settings.active_creative_id) ?? files[0]
  }
  if (settings.display_mode === 'random') {
    return files[Math.floor(Math.random() * files.length)]
  }
  // sequential
  const idx = parseInt(localStorage.getItem(LS_SEQ_INDEX) ?? '0')
  const next = idx % files.length
  localStorage.setItem(LS_SEQ_INDEX, String(next + 1))
  return files[next]
}

function shouldShow(settings: SlotData['settings']): boolean {
  const trigger = settings.show_trigger ?? 'session'
  if (trigger === 'session')  return !sessionStorage.getItem(SS_SESSION)
  if (trigger === 'interval') {
    const mins    = Math.max(1, settings.show_interval_minutes ?? 30)
    const last    = parseInt(localStorage.getItem(LS_LAST_SHOWN) ?? '0')
    return (Date.now() - last) / 60000 >= mins
  }
  return false // consent/clinical triggered externally
}

export function WelcomeMediaModal() {
  const [creative, setCreative] = useState<Creative | null>(null)
  const [visible, setVisible]   = useState(false)
  const slotRef = useRef<SlotData | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { registerTrigger } = useWelcomeMedia()

  const show = useCallback((c: Creative) => {
    setCreative(c)
    setVisible(true)
    localStorage.setItem(LS_LAST_SHOWN, Date.now().toString())
  }, [])

  useEffect(() => {
    api.get('/media').then((data: any) => {
      const slot: SlotData | undefined = data?.welcome
      if (!slot?.files?.length) return
      slotRef.current = slot

      if (shouldShow(slot.settings)) {
        const c = pickCreative(slot)
        if (c) {
          show(c)
          if (slot.settings.show_trigger === 'session') sessionStorage.setItem(SS_SESSION, '1')
        }
      }

      // External triggers (consent / clinical)
      registerTrigger((event: 'consent' | 'clinical') => {
        const s = slotRef.current
        if (!s) return
        const t = s.settings.show_trigger
        if ((t === 'consent' && event === 'consent') || (t === 'clinical' && event === 'clinical')) {
          const c = pickCreative(s)
          if (c) show(c)
        }
      })

      // Interval timer
      if (slot.settings.show_trigger === 'interval') {
        const mins = Math.max(1, slot.settings.show_interval_minutes ?? 30)
        const id = setInterval(() => {
          const s = slotRef.current
          if (s && shouldShow(s.settings)) {
            const c = pickCreative(s)
            if (c) show(c)
          }
        }, mins * 60 * 1000)
        return () => clearInterval(id)
      }
    }).catch(() => {})
  }, [])

  const close = () => { setVisible(false); videoRef.current?.pause() }

  if (!visible || !creative) return null

  const isVideo = creative.content_type?.startsWith('video')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={close}>
      <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={close} className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        {isVideo ? (
          <video ref={videoRef} src={creative.url} autoPlay controls playsInline className="w-full max-h-[80vh] object-contain" onEnded={close} />
        ) : (
          <img src={creative.url} alt="Bienvenida" className="w-full max-h-[80vh] object-contain" />
        )}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <button onClick={close} className="px-5 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-colors">
            Continuar →
          </button>
        </div>
      </div>
    </div>
  )
}
