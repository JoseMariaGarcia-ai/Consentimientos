import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Trash2, Film, Image, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

interface MediaItem {
  id: string
  type: string
  url: string
  original_name: string
  content_type: string
  created_at: string
}

interface Props {
  type: 'welcome' | 'patient'
  title: string
  description: string
  item: MediaItem | null
  onChanged: () => void
}

const MAX_SIZE_MB = 100

export function MediaUploadSlot({ type, title, description, item, onChanged }: Props) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isVideo = item?.content_type.startsWith('video')

  const handleFile = async (file: File) => {
    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > MAX_SIZE_MB) {
      setError(t('mediaUploadSlot.file_too_large', { maxSize: MAX_SIZE_MB }))
      return
    }
    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const base64 = await toBase64WithProgress(file, pct => setProgress(Math.round(pct * 80)))
      setProgress(85)
      await api.post(`/media/${type}`, {
        fileBase64: base64,
        fileName: file.name,
        contentType: file.type,
      })
      setProgress(100)
      onChanged()
    } catch (e: any) {
      setError(e.message ?? t('mediaUploadSlot.upload_error'))
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('mediaUploadSlot.confirm_delete'))) return
    try {
      await api.delete(`/media/${type}`)
      onChanged()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>

      {item ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
          {/* Preview */}
          <div className="relative bg-black flex items-center justify-center" style={{ minHeight: 200 }}>
            {isVideo ? (
              <video
                src={item.url}
                controls
                className="max-h-56 max-w-full rounded-t-2xl"
                style={{ maxHeight: 224 }}
              />
            ) : (
              <img
                src={item.url}
                alt={item.original_name}
                className="max-h-56 max-w-full object-contain"
              />
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              {isVideo ? <Film className="w-3 h-3" /> : <Image className="w-3 h-3" />}
              {isVideo ? t('mediaUploadSlot.video') : t('mediaUploadSlot.image')}
            </div>
          </div>

          {/* File info + actions */}
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs font-medium text-slate-700 truncate max-w-xs">{item.original_name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {t('mediaUploadSlot.uploaded_on', { date: new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {t('mediaUploadSlot.change')}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('mediaUploadSlot.delete')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-colors ${
            uploading ? 'border-blue-300 bg-blue-50 cursor-not-allowed' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-blue-600 font-medium">{t('mediaUploadSlot.uploading', { progress })}</p>
              <div className="w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-3 text-slate-300">
                <Film className="w-8 h-8" />
                <Image className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">{t('mediaUploadSlot.drop_hint')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('mediaUploadSlot.file_types_hint', { maxSize: MAX_SIZE_MB })}</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">⚠️ {error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); (e.target as HTMLInputElement).value = '' }}
      />
    </div>
  )
}

function toBase64WithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total) }
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
