import { useState, useRef } from 'react'
import { Camera, Trash2, Upload, ArrowLeftRight, X, ZoomIn, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { BeforeAfterModal } from './BeforeAfterModal'

interface Photo {
  id: string
  url: string
  original_name: string
  created_at: string
  order_index: number
}

interface PhotoSession {
  id: string
  name: string | null
  notes: string | null
  session_date: string
  photos: Photo[]
}

interface Props {
  session: PhotoSession
  onChange: (updated: PhotoSession) => void
  onDelete: () => void
}

const MAX = 10

export function PhotoSessionPanel({ session, onChange, onDelete }: Props) {
  const { t } = useTranslation()
  const [uploading, setUploading]         = useState(false)
  const [lightbox, setLightbox]           = useState<Photo | null>(null)
  const [compareOpen, setCompareOpen]     = useState(false)
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null)
  const [progress, setProgress]           = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const remaining = MAX - session.photos.length

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    setProgress(0)
    let done = 0
    const added: Photo[] = []

    for (const file of toUpload) {
      const base64 = await toBase64(file)
      try {
        const photo = await api.post(`/photo-sessions/${session.id}/photos`, {
          fileBase64: base64,
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          orderIndex: session.photos.length + added.length,
        })
        added.push(photo)
      } catch (e: any) {
        console.error('Upload error', e.message)
      }
      done++
      setProgress(Math.round((done / toUpload.length) * 100))
    }

    onChange({ ...session, photos: [...session.photos, ...added] })
    setUploading(false)
    setProgress(0)
  }

  const handleDeletePhoto = async (photoId: string) => {
    setDeletingPhoto(photoId)
    try {
      await api.delete(`/photo-sessions/photos/${photoId}`)
      onChange({ ...session, photos: session.photos.filter(p => p.id !== photoId) })
    } finally {
      setDeletingPhoto(null)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Session header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Camera className="w-4 h-4 text-violet-500" />
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {session.name || t('photoSessionPanel.default_session_name')}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(session.session_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {' · '}{t('photoSessionPanel.photo_count', { count: session.photos.length, max: MAX })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {session.photos.length >= 2 && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {t('photoSessionPanel.compare_button')}
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 ml-1"
            title={t('photoSessionPanel.delete_session')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Photo grid */}
      <div className="p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {session.photos.map(photo => (
            <div key={photo.id} className="relative group" style={{ aspectRatio: '1' }}>
              <img
                src={photo.url}
                alt={photo.original_name}
                className="w-full h-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightbox(photo)}
              />
              <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                disabled={deletingPhoto === photo.id}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                {deletingPhoto === photo.id
                  ? <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  : <X className="w-3 h-3" />
                }
              </button>
              <button
                onClick={() => setLightbox(photo)}
                className="absolute bottom-1 left-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Upload slot */}
          {remaining > 0 && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-violet-400 rounded-xl text-slate-400 hover:text-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ aspectRatio: '1' }}
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-violet-400/40 border-t-violet-500 rounded-full animate-spin mb-1" />
                  <span className="text-[10px] font-medium">{progress}%</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium">{t('photoSessionPanel.upload')}</span>
                  <span className="text-[9px] text-slate-300">{t('photoSessionPanel.remaining', { remaining })}</span>
                </>
              )}
            </button>
          )}
        </div>

        {session.notes && (
          <p className="mt-3 text-xs text-slate-500 italic">{session.notes}</p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
        onClick={e => { (e.target as HTMLInputElement).value = '' }}
      />

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.original_name}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">{lightbox.original_name}</p>
        </div>
      )}

      {/* Before/After modal */}
      {compareOpen && (
        <BeforeAfterModal photos={session.photos} onClose={() => setCompareOpen(false)} />
      )}
    </div>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
