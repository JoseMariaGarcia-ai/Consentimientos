import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { pickCreative, type SlotData, type Creative } from '@/lib/mediaCreative'
import { CreativeViewer } from './CreativeViewer'

const SS_SHOWN      = 'patient_media_shown_session'
const LS_SEQ_INDEX  = 'patient_media_seq_index'

// Shows the lab/clinic's "patient content" creative once per browser session
// as soon as the patient opens their portal — no configurable trigger here,
// unlike the staff-facing welcome screen, since the ask is simply "on entry".
export function PatientAdModal() {
  const { t } = useTranslation()
  const [creative, setCreative] = useState<Creative | null>(null)
  const [closeDelay, setCloseDelay] = useState(0)
  const [visible, setVisible]   = useState(false)
  const impressionIdRef = useRef<string | null>(null)
  const openedAtRef = useRef<number>(0)

  useEffect(() => {
    if (sessionStorage.getItem(SS_SHOWN)) return
    api.get('/media').then((data: any) => {
      const slot: SlotData | null = data?.patient ?? null
      if (!slot || !slot.files.length) return
      const c = pickCreative(slot, LS_SEQ_INDEX)
      if (!c) return
      setCreative(c)
      setCloseDelay(slot.settings.close_delay_seconds ?? 0)
      setVisible(true)
      sessionStorage.setItem(SS_SHOWN, '1')
      openedAtRef.current = Date.now()
      api.post('/media/impressions', { type: 'patient', creative_id: c.id })
        .then((res: any) => { impressionIdRef.current = res?.id ?? null })
        .catch(() => {})
    }).catch(() => {})
  }, [])

  const handleClose = () => {
    setVisible(false)
    if (impressionIdRef.current) {
      const seconds = Math.round((Date.now() - openedAtRef.current) / 1000)
      api.put(`/media/impressions/${impressionIdRef.current}`, { viewDurationSeconds: seconds }).catch(() => {})
    }
  }

  if (!visible || !creative) return null

  return (
    <CreativeViewer
      creative={creative}
      onClose={handleClose}
      altText={t('patientAdModal.alt')}
      continueLabel={t('patientAdModal.continue')}
      closeDelaySeconds={closeDelay}
    />
  )
}
