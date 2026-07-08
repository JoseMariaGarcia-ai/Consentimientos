import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import { deviceApi, getDeviceToken, getDeviceClinicName, clearDeviceSession } from '@/lib/deviceAuth'
import { KioskConsentSigner } from '@/components/consents/KioskConsentSigner'

const POLL_INTERVAL_MS = 3000

export default function TabletKiosk() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pending, setPending] = useState<{ handoffId: string; consent: any } | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const pollingPaused = useRef(false)

  useEffect(() => {
    if (!getDeviceToken()) navigate('/tablet-pair')
  }, [navigate])

  const poll = useCallback(async () => {
    if (pollingPaused.current) return
    try {
      const data = await deviceApi.get('/signing-kiosk/pending')
      if (data?.consent) {
        pollingPaused.current = true
        setPending(data)
      }
    } catch (e: any) {
      if (String(e.message).includes('no autorizado') || String(e.message).includes('vinculado')) {
        clearDeviceSession()
        setUnauthorized(true)
      }
    }
  }, [])

  useEffect(() => {
    if (unauthorized) return
    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [poll, unauthorized])

  useEffect(() => {
    if (unauthorized) {
      const timeout = setTimeout(() => navigate('/tablet-pair'), 2500)
      return () => clearTimeout(timeout)
    }
  }, [unauthorized, navigate])

  const handleDone = () => {
    setPending(null)
    pollingPaused.current = false
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-[#0D1B2E] flex flex-col items-center justify-center text-center p-6">
        <p className="text-white text-lg font-semibold">{t('tabletSigning.revoked')}</p>
        <p className="text-slate-400 text-sm mt-2">{t('tabletSigning.redirecting')}</p>
      </div>
    )
  }

  if (pending) {
    return <KioskConsentSigner consent={pending.consent} onDone={handleDone} />
  }

  return (
    <div className="min-h-screen bg-[#0D1B2E] flex flex-col items-center justify-center text-center p-6">
      <div className="text-3xl font-extrabold text-white mb-1">
        Consents<span className="text-[#C9A84C]">Pro</span>
      </div>
      <p className="text-sm text-slate-400 mb-12">{getDeviceClinicName()}</p>

      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
        <ClipboardCheck className="w-8 h-8 text-[#C9A84C]" />
      </div>
      <p className="text-white text-xl font-semibold">{t('tabletSigning.waiting')}</p>
      <p className="text-slate-400 text-sm mt-2">{t('tabletSigning.waiting_hint')}</p>
    </div>
  )
}
