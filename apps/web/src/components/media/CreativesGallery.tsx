import { useState, useRef } from 'react'
import { Upload, Trash2, Film, Image, Loader2, CheckCircle2, Shuffle, ListOrdered, MousePointer } from 'lucide-react'
import { api } from '@/lib/api'

interface Creative {
  id: string
  url: string
  original_name: string
  content_type: string
  order_index: number
  created_at: string
}

interface Settings {
  show_trigger: string
  show_interval_minutes: number
  display_mode: 'manual' | 'random' | 'sequential'
  active_creative_id: string | null
}

interface Props {
  type: 'welcome' | 'patient'
  title: string
  description: string
  files: Creative[]
  settings: Settings | null
  onChanged: () => void
}

const MAX = 5

const DISPLAY_MODES = [
  { value: 'manual',     icon: MousePointer,  label: 'Selección manual',   desc: 'Tú eliges cuál se muestra. Haz clic en una creatividad para activarla.' },
  { value: 'random',     icon: Shuffle,       label: 'Orden aleatorio',     desc: 'Se elige una creatividad al azar cada vez que toca mostrarla.' },
  { value: 'sequential', icon: ListOrdered,   label: 'Orden secuencial',    desc: 'Se van mostrando en orden, una por una, cada vez que toca.' },
]

export function CreativesGallery({ type, title, description, files, settings, onChanged }: Props) {
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingMode, setSavingMode] = useState(false)
  const [error, setError]           = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayMode  = settings?.display_mode ?? 'manual'
  const activeId     = settings?.active_creative_id ?? null

  const handleFile = async (file: File) => {
    if (file.size / 1024 / 1024 > 100) { setError('El archivo supera el límite de 100 MB'); return }
    setUploading(true); setError(''); setProgress(0)
    try {
      const base64 = await toBase64Progress(file, p => setProgress(Math.round(p * 80)))
      setProgress(85)
      await api.post(`/media/${type}`, { fileBase64: base64, fileName: file.name, contentType: file.type })
      setProgress(100)
      onChanged()
    } catch (e: any) { setError(e.message) }
    finally { setUploading(false); setProgress(0) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta creatividad?')) return
    setDeletingId(id)
    try { await api.delete(`/media/${type}/file/${id}`); onChanged() }
    catch (e: any) { setError(e.message) }
    finally { setDeletingId(null) }
  }

  const handleSetActive = async (id: string) => {
    try {
      await api.put(`/media/${type}/config`, { active_creative_id: id, display_mode: 'manual' })
      onChanged()
    } catch (e: any) { setError(e.message) }
  }

  const handleModeChange = async (mode: string) => {
    setSavingMode(true)
    try { await api.put(`/media/${type}/config`, { display_mode: mode }); onChanged() }
    catch (e: any) { setError(e.message) }
    finally { setSavingMode(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>

      {/* Creatives grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {files.map(f => {
          const isActive  = activeId === f.id
          const isVideo   = f.content_type.startsWith('video')
          const deleting  = deletingId === f.id

          return (
            <div key={f.id} className="flex flex-col gap-1.5">
              <div
                className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                  isActive && displayMode === 'manual'
                    ? 'border-pink-500 shadow-md shadow-pink-200'
                    : 'border-transparent hover:border-slate-300'
                }`}
                style={{ aspectRatio: '9/16' }}
                onClick={() => displayMode === 'manual' && handleSetActive(f.id)}
              >
                {isVideo ? (
                  <video src={f.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={f.url} alt={f.original_name} className="w-full h-full object-cover" />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                {/* Active badge */}
                {isActive && displayMode === 'manual' && (
                  <div className="absolute top-1.5 left-1.5 bg-pink-500 text-white rounded-full p-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Type badge */}
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-black/60 text-white rounded-full px-1.5 py-0.5 text-[9px] font-medium">
                  {isVideo ? <Film className="w-2.5 h-2.5" /> : <Image className="w-2.5 h-2.5" />}
                  {isVideo ? 'Vídeo' : 'Imagen'}
                </div>

                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(f.id) }}
                  disabled={deleting}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  {deleting
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Trash2 className="w-3 h-3" />
                  }
                </button>
              </div>

              {/* Manual select button */}
              {displayMode === 'manual' && (
                <button
                  onClick={() => handleSetActive(f.id)}
                  className={`text-[10px] font-semibold py-1 rounded-lg transition-colors ${
                    isActive ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-600'
                  }`}
                >
                  {isActive ? '✓ Activa' : 'Seleccionar'}
                </button>
              )}
            </div>
          )
        })}

        {/* Upload slot */}
        {files.length < MAX && (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              uploading
                ? 'border-pink-300 bg-pink-50 cursor-not-allowed'
                : 'border-slate-300 hover:border-pink-400 hover:bg-slate-50'
            }`}
            style={{ aspectRatio: '9/16' }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-pink-500 animate-spin mb-1" />
                <span className="text-[10px] font-medium text-pink-600">{progress}%</span>
                <div className="w-10 h-1 bg-pink-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-300 mb-1" />
                <span className="text-[10px] font-medium text-slate-400">Subir</span>
                <span className="text-[9px] text-slate-300 mt-0.5">{MAX - files.length} libre{MAX - files.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Display mode selector — only when there are ≥2 creatives */}
      {files.length >= 2 && (
        <div className="flex flex-col gap-2 pt-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">¿Cómo mostrarlas?</p>
          <div className="flex flex-col gap-1.5">
            {DISPLAY_MODES.map(m => {
              const Icon = m.icon
              const active = displayMode === m.value
              return (
                <label key={m.value} className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${active ? 'border-pink-300 bg-pink-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input
                    type="radio"
                    name={`display_mode_${type}`}
                    value={m.value}
                    checked={active}
                    onChange={() => handleModeChange(m.value)}
                    className="mt-0.5 accent-pink-600 flex-shrink-0"
                    disabled={savingMode}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-pink-600' : 'text-slate-400'}`} />
                      <p className={`text-xs font-semibold ${active ? 'text-pink-800' : 'text-slate-700'}`}>{m.label}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-5">{m.desc}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">⚠️ {error}</p>}

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

function toBase64Progress(file: File, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total) }
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
