import { useState } from 'react'
import { Fingerprint, X, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { registerBiometric, markBiometricRegistered } from '@/lib/webauthn'

interface Props {
  onClose: () => void
}

export function BiometricPrompt({ onClose }: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<'prompt' | 'registering' | 'success' | 'error'>('prompt')
  const [deviceName] = useState(() => {
    const ua = navigator.userAgent
    if (/iPhone|iPad/.test(ua)) return 'iPhone / iPad'
    if (/Android/.test(ua)) return 'Android'
    if (/Mac/.test(ua)) return 'Mac'
    return t('biometricPrompt.default_device')
  })

  const handleActivate = async () => {
    setState('registering')
    const ok = await registerBiometric(deviceName)
    if (ok) {
      markBiometricRegistered()
      setState('success')
      setTimeout(onClose, 1800)
    } else {
      setState('error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        {state === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
            <p className="font-semibold text-slate-800">{t('auth.biometric_success')}</p>
            <p className="text-sm text-slate-500 text-center">{t('auth.biometric_success_msg')}</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-blue-600" />
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">{t('biometricPrompt.title')}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {t('biometricPrompt.description')}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
              <span className="font-medium">{t('biometricPrompt.device_label')}</span> {deviceName}
            </div>

            {state === 'error' && (
              <p className="text-sm text-red-500">
                {t('auth.biometric_error')}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
              >
                {t('auth.biometric_now')}
              </button>
              <button
                onClick={handleActivate}
                disabled={state === 'registering'}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {state === 'registering' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.biometric_registering')}</>
                ) : (
                  <><Fingerprint className="w-4 h-4" /> {t('biometricPrompt.activate')}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
