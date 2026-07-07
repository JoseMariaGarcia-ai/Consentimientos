import { useState, useEffect } from 'react'
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
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SS_SHOWN)) return
    api.get('/media').then((data: any) => {
      const slot: SlotData | null = data?.patient ?? null
      if (!slot || !slot.files.length) return
      const c = pickCreative(slot, LS_SEQ_INDEX)
      if (!c) return
      setCreative(c)
      setVisible(true)
      sessionStorage.setItem(SS_SHOWN, '1')
      api.post('/media/impressions', { type: 'patient', creative_id: c.id }).catch(() => {})
    }).catch(() => {})
  }, [])

  if (!visible || !creative) return null

  return (
    <CreativeViewer
      creative={creative}
      onClose={() => setVisible(false)}
      altText={t('patientAdModal.alt')}
      continueLabel={t('patientAdModal.continue')}
    />
  )
}
