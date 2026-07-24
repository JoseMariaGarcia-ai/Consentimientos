import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useWelcomeMedia } from '@/context/WelcomeMediaContext'
import { pickCreative, type SlotData, type Creative } from '@/lib/mediaCreative'
import { CreativeViewer } from './CreativeViewer'

const LS_LAST_SHOWN = 'welcome_media_last_shown'
const LS_SEQ_INDEX  = 'welcome_media_seq_index'
const SS_SESSION    = 'welcome_media_shown_session'

function parseTriggers(raw: string | null | undefined): string[] {
  if (!raw) return ['session']
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

function shouldShow(settings: SlotData['settings']): boolean {
  const triggers = parseTriggers(settings.show_trigger)
  if (triggers.includes('session') && !sessionStorage.getItem(SS_SESSION)) return true
  if (triggers.includes('interval')) {
    const mins = Math.max(1, settings.show_interval_minutes ?? 30)
    const last = parseInt(localStorage.getItem(LS_LAST_SHOWN) ?? '0')
    if ((Date.now() - last) / 60000 >= mins) return true
  }
  return false
}

async function fetchSlot(): Promise<SlotData | null> {
  try {
    const data: any = await api.get('/media')
    return data?.welcome ?? null
  } catch {
    return null
  }
}

export function WelcomeMediaModal() {
  const { t } = useTranslation()
  const [creative, setCreative] = useState<Creative | null>(null)
  const [closeDelay, setCloseDelay] = useState(0)
  const [visible, setVisible]   = useState(false)
  const { registerTrigger } = useWelcomeMedia()
  const impressionIdRef = useRef<string | null>(null)
  const openedAtRef = useRef<number>(0)

  const show = useCallback((c: Creative, delaySeconds: number) => {
    setCreative(c)
    setCloseDelay(delaySeconds)
    setVisible(true)
    localStorage.setItem(LS_LAST_SHOWN, Date.now().toString())
    openedAtRef.current = Date.now()
    api.post('/media/impressions', { type: 'welcome', creative_id: c.id })
      .then((res: any) => { impressionIdRef.current = res?.id ?? null })
      .catch(() => {})
  }, [])

  const handleClose = () => {
    setVisible(false)
    if (impressionIdRef.current) {
      const seconds = Math.round((Date.now() - openedAtRef.current) / 1000)
      api.put(`/media/impressions/${impressionIdRef.current}`, { viewDurationSeconds: seconds }).catch(() => {})
    }
  }

  useEffect(() => {
    // Initial load: auto-show for session/interval triggers
    fetchSlot().then(slot => {
      if (!slot) return

      if (shouldShow(slot.settings)) {
        const c = pickCreative(slot, LS_SEQ_INDEX)
        if (c) {
          show(c, slot.settings.close_delay_seconds ?? 0)
          if (slot.settings.show_trigger === 'session') sessionStorage.setItem(SS_SESSION, '1')
        }
      }

      // Interval timer
      if (parseTriggers(slot.settings.show_trigger).includes('interval')) {
        const mins = Math.max(1, slot.settings.show_interval_minutes ?? 30)
        const id = setInterval(async () => {
          const s = await fetchSlot()
          if (s && shouldShow(s.settings)) {
            const c = pickCreative(s, LS_SEQ_INDEX)
            if (c) show(c, s.settings.close_delay_seconds ?? 0)
          }
        }, mins * 60 * 1000)
        return () => clearInterval(id)
      }
    })

    // External triggers: always re-fetch fresh data so new creatives/settings are picked up
    registerTrigger(async (event: 'consent' | 'clinical') => {
      const slot = await fetchSlot()
      if (!slot) return
      const triggers = parseTriggers(slot.settings.show_trigger)
      if (triggers.includes(event)) {
        const c = pickCreative(slot, LS_SEQ_INDEX)
        if (c) show(c, slot.settings.close_delay_seconds ?? 0)
      }
    })
  }, [])

  if (!visible || !creative) return null

  return (
    <CreativeViewer
      creative={creative}
      onClose={handleClose}
      altText={t('welcomeMediaModal.welcomeAlt')}
      continueLabel={t('welcomeMediaModal.continue')}
      closeDelaySeconds={closeDelay}
    />
  )
}
