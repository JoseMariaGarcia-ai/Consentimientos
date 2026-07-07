export interface Creative {
  id: string
  url: string
  content_type: string
  original_name: string
}

export interface SlotSettings {
  show_trigger: string
  show_interval_minutes: number
  display_mode: 'manual' | 'random' | 'sequential'
  active_creative_id: string | null
}

export interface SlotData {
  settings: SlotSettings
  files: Creative[]
}

export function pickCreative(slot: SlotData, seqStorageKey: string): Creative | null {
  const { files, settings } = slot
  if (!files.length) return null
  if (settings.display_mode === 'manual') {
    return files.find(f => f.id === settings.active_creative_id) ?? files[0]
  }
  if (settings.display_mode === 'random') {
    return files[Math.floor(Math.random() * files.length)]
  }
  // sequential
  const idx  = parseInt(localStorage.getItem(seqStorageKey) ?? '0')
  const next = idx % files.length
  localStorage.setItem(seqStorageKey, String(next + 1))
  return files[next]
}

export function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const ytId = u.searchParams.get('v') ?? (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null)
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1`
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/shorts/')) {
      return `https://www.youtube.com/embed/${u.pathname.split('/')[2]}?autoplay=1&mute=1`
    }
    const vimeoId = u.hostname.includes('vimeo.com') ? u.pathname.split('/').filter(Boolean)[0] : null
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1`
  } catch {}
  return null
}
