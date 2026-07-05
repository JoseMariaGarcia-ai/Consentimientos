import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Upload, Trash2, ImageOff, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getToken } from '@/lib/auth'

const API = import.meta.env.VITE_API_URL ?? ''

interface Props {
  patientId: string
  patientName: string
  onClose: () => void
}

interface Photo { key: string; url: string }

export function PatientGallery({ patientId, patientName, onClose }: Props) {
  const { t } = useTranslation()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/photos/${patientId}`)
      setPhotos(Array.isArray(data) ? data : [])
    } catch { setPhotos([]) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [patientId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
      await api.post(`/photos/${patientId}`, {
        fileBase64: base64,
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
      })
    }
    await load()
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDelete = async (key: string) => {
    if (!confirm(t('patientGallery.confirm_delete'))) return
    setDeleting(key)
    try {
      await fetch(`${API}/photos/file/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      setPhotos(ps => ps.filter(p => p.key !== key))
    } finally { setDeleting(null) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t('patientGallery.title')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{patientName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => inputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {t('patientGallery.upload_photos')}
              </button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('patientGallery.loading')}
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
                <ImageOff className="w-8 h-8" />
                <p className="text-sm">{t('patientGallery.empty')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {photos.map(p => (
                  <div key={p.key} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
                    <img src={p.url} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => setPreview(p.url)} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button onClick={() => handleDelete(p.key)} disabled={deleting === p.key}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40">
                      {deleting === p.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
            {t('patientGallery.count_stored', { count: photos.length, unit: photos.length === 1 ? t('patientGallery.photo_singular') : t('patientGallery.photo_plural') })}
          </div>
        </div>
      </div>
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
          <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-xl hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  )
}
