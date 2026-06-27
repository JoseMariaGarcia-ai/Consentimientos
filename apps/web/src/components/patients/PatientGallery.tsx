import { useState, useEffect, useRef } from 'react'
import { X, Upload, Trash2, ImageOff, Loader2 } from 'lucide-react'

interface Props {
  patientId: string
  patientName: string
  onClose: () => void
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const FOLDER = (patientId: string) => `consentspro/patients/${patientId}`

interface Photo { publicId: string; url: string }

export function PatientGallery({ patientId, patientName, onClose }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      // Cloudinary Search API (unsigned — list by folder tag)
      const res = await fetch(
        `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${FOLDER(patientId)}.json`
      )
      if (!res.ok) { setPhotos([]); return }
      const data = await res.json()
      const items: Photo[] = (data.resources ?? []).map((r: any) => ({
        publicId: r.public_id,
        url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,q_auto/${r.public_id}`,
      }))
      setPhotos(items)
    } catch { setPhotos([]) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [patientId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET)
      fd.append('folder', FOLDER(patientId))
      await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST', body: fd,
      })
    }
    await load()
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDelete = async (publicId: string) => {
    if (!confirm('¿Eliminar esta foto?')) return
    setDeleting(publicId)
    // Deletion requires signed request — call backend endpoint
    await fetch(`${import.meta.env.VITE_API_URL}/photos/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('cp_token')}` },
    })
    setPhotos(ps => ps.filter(p => p.publicId !== publicId))
    setDeleting(null)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Galería de fotos</h2>
              <p className="text-xs text-slate-400 mt-0.5">{patientName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => inputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Subir fotos
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
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
                <ImageOff className="w-8 h-8" />
                <p className="text-sm">Sin fotos. Sube la primera imagen.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {photos.map(p => (
                  <div key={p.publicId} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
                    <img src={p.url} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => setPreview(p.url)} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button onClick={() => handleDelete(p.publicId)} disabled={deleting === p.publicId}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40">
                      {deleting === p.publicId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} · Almacenadas en Cloudinary
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
