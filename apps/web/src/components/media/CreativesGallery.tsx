import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Trash2, Film, Image, Loader2, CheckCircle2, Shuffle, ListOrdered, MousePointer, Link, X } from 'lucide-react'
import { api } from '@/lib/api'

interface Creative {
  id: string
  url: string
  source_url?: string
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
  readOnly?: boolean
}

const MAX = 5

const DISPLAY_MODES = [
  { value: 'manual',     icon: MousePointer },
  { value: 'random',     icon: Shuffle },
  { value: 'sequential', icon: ListOrdered },
]

// Detect YouTube / Vimeo and return embed URL
function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // YouTube
    const ytId = u.searchParams.get('v') ?? (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null)
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1`
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/shorts/')) {
      return `https://www.youtube.com/embed/${u.pathname.split('/')[2]}?autoplay=1`
    }
    // Vimeo
    const vimeoId = u.hostname.includes('vimeo.com') ? u.pathname.split('/').filter(Boolean)[0] : null
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
  } catch {}
  return null
}

function isUrlCreative(c: Creative) { return c.content_type === 'video/url' }

export function CreativesGallery({ type, title, description, files, settings, onChanged, readOnly = false }: Props) {
  const { t } = useTranslation()
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingMode, setSavingMode] = useState(false)
  const [error, setError]           = useState('')
  const [urlInput, setUrlInput]     = useState('')
  const [urlLabel, setUrlLabel]     = useState('')
  const [showUrlForm, setShowUrlForm] = useState(false)
  const [savingUrl, setSavingUrl]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayMode = settings?.display_mode ?? 'manual'
  const activeId    = settings?.active_creative_id ?? null

  const handleFile = async (file: File) => {
    if (file.size / 1024 / 1024 > 100) { setError(t('creativesGallery.errors.fileTooLarge')); return }
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

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return
    try { new URL(urlInput) } catch { setError(t('creativesGallery.errors.invalidUrl')); return }
    setSavingUrl(true); setError('')
    try {
      await api.post(`/media/${type}/url`, { source_url: urlInput.trim(), label: urlLabel.trim() || urlInput.trim() })
      setUrlInput(''); setUrlLabel(''); setShowUrlForm(false)
      onChanged()
    } catch (e: any) { setError(e.message) }
    finally { setSavingUrl(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('creativesGallery.confirmDelete'))) return
    setDeletingId(id)
    try { await api.delete(`/media/${type}/file/${id}`); onChanged() }
    catch (e: any) { setError(e.message) }
    finally { setDeletingId(null) }
  }

  const handleSetActive = async (id: string) => {
    try { await api.put(`/media/${type}/config`, { active_creative_id: id, display_mode: 'manual' }); onChanged() }
    catch (e: any) { setError(e.message) }
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
          const isUrl     = isUrlCreative(f)
          const isVideo   = f.content_type.startsWith('video') && !isUrl
          const deleting  = deletingId === f.id
          const embed     = isUrl ? getEmbedUrl(f.url) : null

          return (
            <div key={f.id} className="flex flex-col gap-1.5">
              <div
                className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                  isActive && displayMode === 'manual'
                    ? 'border-pink-500 shadow-md shadow-pink-200'
                    : 'border-transparent hover:border-slate-300'
                }`}
                style={{ aspectRatio: '9/16' }}
                onClick={() => !readOnly && displayMode === 'manual' && handleSetActive(f.id)}
              >
                {isUrl ? (
                  embed ? (
                    <iframe
                      src={embed.replace('autoplay=1', 'autoplay=0')}
                      className="w-full h-full pointer-events-none"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                      allowFullScreen
                      title={f.original_name}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-1 p-2">
                      <Link className="w-5 h-5 text-slate-400" />
                      <p className="text-[9px] text-slate-400 text-center break-all leading-tight">{f.url.slice(0, 40)}…</p>
                    </div>
                  )
                ) : isVideo ? (
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
                  {isUrl ? <Link className="w-2.5 h-2.5" /> : isVideo ? <Film className="w-2.5 h-2.5" /> : <Image className="w-2.5 h-2.5" />}
                  {isUrl ? t('creativesGallery.types.url') : isVideo ? t('creativesGallery.types.video') : t('creativesGallery.types.image')}
                </div>

                {/* Delete */}
                {!readOnly && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(f.id) }}
                    disabled={deleting}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {displayMode === 'manual' && (
                readOnly ? (
                  isActive && <p className="text-[10px] font-semibold py-1 rounded-lg bg-pink-100 text-pink-700 text-center">{t('creativesGallery.active')}</p>
                ) : (
                  <button
                    onClick={() => handleSetActive(f.id)}
                    className={`text-[10px] font-semibold py-1 rounded-lg transition-colors ${
                      isActive ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-600'
                    }`}
                  >
                    {isActive ? t('creativesGallery.active') : t('creativesGallery.select')}
                  </button>
                )
              )}
            </div>
          )
        })}

        {/* Upload slot */}
        {!readOnly && files.length < MAX && (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              uploading ? 'border-pink-300 bg-pink-50 cursor-not-allowed' : 'border-slate-300 hover:border-pink-400 hover:bg-slate-50'
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
                <span className="text-[10px] font-medium text-slate-400">{t('creativesGallery.upload.label')}</span>
                <span className="text-[9px] text-slate-300 mt-0.5">
                  {t('creativesGallery.upload.slotsFree', { count: MAX - files.length, suffix: MAX - files.length !== 1 ? 's' : '' })}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* URL button */}
      {!readOnly && files.length < MAX && (
        <div>
          {!showUrlForm ? (
            <button
              onClick={() => setShowUrlForm(true)}
              className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Link className="w-3.5 h-3.5" />
              {t('creativesGallery.addUrlButton')}
            </button>
          ) : (
            <div className="flex flex-col gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">{t('creativesGallery.urlForm.title')}</p>
                <button onClick={() => { setShowUrlForm(false); setUrlInput(''); setUrlLabel(''); setError('') }}>
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder={t('creativesGallery.urlForm.urlPlaceholder')}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
                onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                autoFocus
              />
              <input
                type="text"
                value={urlLabel}
                onChange={e => setUrlLabel(e.target.value)}
                placeholder={t('creativesGallery.urlForm.labelPlaceholder')}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <p className="text-[10px] text-slate-400">{t('creativesGallery.urlForm.hint')}</p>
              <button
                onClick={handleAddUrl}
                disabled={!urlInput.trim() || savingUrl}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-pink-600 text-white rounded-lg text-xs font-semibold hover:bg-pink-700 disabled:opacity-50"
              >
                {savingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
                {savingUrl ? t('creativesGallery.urlForm.saving') : t('creativesGallery.urlForm.add')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Display mode selector — only when ≥2 creatives */}
      {files.length >= 2 && (
        <div className="flex flex-col gap-2 pt-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('creativesGallery.displayModeHeading')}</p>
          <div className="flex flex-col gap-1.5">
            {DISPLAY_MODES.map(m => {
              const Icon = m.icon
              const active = displayMode === m.value
              if (readOnly && !active) return null
              return (
                <label key={m.value} className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors ${active ? 'border-pink-300 bg-pink-50' : 'border-slate-200 hover:border-slate-300'} ${readOnly ? '' : 'cursor-pointer'}`}>
                  {!readOnly && (
                    <input
                      type="radio"
                      name={`display_mode_${type}`}
                      value={m.value}
                      checked={active}
                      onChange={() => handleModeChange(m.value)}
                      className="mt-0.5 accent-pink-600 flex-shrink-0"
                      disabled={savingMode}
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-pink-600' : 'text-slate-400'}`} />
                      <p className={`text-xs font-semibold ${active ? 'text-pink-800' : 'text-slate-700'}`}>{t(`creativesGallery.displayModes.${m.value}.label`)}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-5">{t(`creativesGallery.displayModes.${m.value}.desc`)}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">⚠️ {error}</p>}

      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); (e.target as HTMLInputElement).value = '' }}
        />
      )}
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
