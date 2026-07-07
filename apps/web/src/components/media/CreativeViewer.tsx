import { useRef } from 'react'
import { X } from 'lucide-react'
import { getEmbedUrl, type Creative } from '@/lib/mediaCreative'

interface CreativeViewerProps {
  creative: Creative
  onClose: () => void
  altText: string
  continueLabel: string
}

export function CreativeViewer({ creative, onClose, altText, continueLabel }: CreativeViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const isUrlCreative = creative.content_type === 'video/url'
  const isVideo       = creative.content_type?.startsWith('video') && !isUrlCreative
  const embedUrl      = isUrlCreative ? getEmbedUrl(creative.url) : null

  const close = () => { videoRef.current?.pause(); onClose() }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={close}>
      <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={close} className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        {isUrlCreative ? (
          embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full"
              style={{ height: 'min(80vh, 540px)' }}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={creative.original_name}
            />
          ) : (
            <video ref={videoRef} src={creative.url} autoPlay muted controls playsInline className="w-full max-h-[80vh] object-contain" onEnded={close} />
          )
        ) : isVideo ? (
          <video ref={videoRef} src={creative.url} autoPlay muted controls playsInline className="w-full max-h-[80vh] object-contain" onEnded={close} />
        ) : (
          <img src={creative.url} alt={altText} className="w-full max-h-[80vh] object-contain" />
        )}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <button onClick={close} className="px-5 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-colors">
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
