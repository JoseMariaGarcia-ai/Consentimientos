import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import jsQR from 'jsqr'
import { ScanLine, CheckCircle2, XCircle } from 'lucide-react'
import { deviceApi, saveDeviceSession, getDeviceToken } from '@/lib/deviceAuth'

type Status = 'idle' | 'scanning' | 'pairing' | 'done' | 'error'

export default function TabletPair() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [clinicName, setClinicName] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>()

  const pair = useCallback(async (code: string) => {
    setStatus('pairing')
    setError('')
    try {
      const data = await deviceApi.post('/signing-devices/pair', { code })
      saveDeviceSession(data.deviceToken, data.clinicName)
      setClinicName(data.clinicName)
      setStatus('done')
      setTimeout(() => navigate('/tablet-kiosk'), 1200)
    } catch (e: any) {
      setError(e.message || t('tabletSigning.pair_error'))
      setStatus('error')
    }
  }, [navigate, t])

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [])

  const startScanning = useCallback(async () => {
    setError('')
    setStatus('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()

      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!

      const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const result = jsQR(imageData.data, imageData.width, imageData.height)
          if (result?.data) {
            stopCamera()
            const decoded = result.data
            const match = decoded.match(/[?&]code=([^&]+)/)
            const code = match ? decodeURIComponent(match[1]) : decoded
            pair(code)
            return
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setError(t('tabletSigning.camera_error'))
      setStatus('error')
    }
  }, [pair, stopCamera, t])

  useEffect(() => {
    if (getDeviceToken()) { navigate('/tablet-kiosk'); return }
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) pair(codeFromUrl)
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#0D1B2E] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-3xl font-extrabold text-white mb-1">
        Consents<span className="text-[#C9A84C]">Pro</span>
      </div>
      <p className="text-sm text-slate-400 mb-10">{t('tabletSigning.pair_title')}</p>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center gap-5">
        {status === 'idle' && (
          <>
            <ScanLine className="w-14 h-14 text-slate-300" />
            <p className="text-sm text-slate-500">{t('tabletSigning.pair_intro')}</p>
            <button
              onClick={startScanning}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              {t('tabletSigning.scan_button')}
            </button>
          </>
        )}

        {status === 'scanning' && (
          <>
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-8 border-4 border-white/70 rounded-2xl pointer-events-none" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <p className="text-sm text-slate-500">{t('tabletSigning.scanning_hint')}</p>
            <button onClick={() => { stopCamera(); setStatus('idle') }} className="text-sm text-slate-400 hover:text-slate-600">
              {t('common.cancel')}
            </button>
          </>
        )}

        {status === 'pairing' && (
          <>
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">{t('tabletSigning.pairing')}</p>
          </>
        )}

        {status === 'done' && (
          <>
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="text-base font-semibold text-slate-800">{t('tabletSigning.paired_with', { clinic: clinicName })}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => setStatus('idle')} className="w-full py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50">
              {t('tabletSigning.try_again')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
