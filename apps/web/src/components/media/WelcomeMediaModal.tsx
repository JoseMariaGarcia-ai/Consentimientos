import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { api } from '@/lib/api'

const SESSION_KEY = 'welcome_media_shown'

export function WelcomeMediaModal() {
  const [media, setMedia]     = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Only show once per browser session
    if (sessionStorage.getItem(SESSION_KEY)) return
    api.get('/media').then((data: any) => {
      if (data?.welcome) {
        setMedia(data.welcome)
        setVisible(true)
        sessionStorage.setItem(SESSION_KEY, '1')
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
