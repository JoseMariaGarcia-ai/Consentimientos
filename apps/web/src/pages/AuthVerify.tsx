import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { saveSession } from '@/lib/auth'

const API = import.meta.env.VITE_API_URL ?? ''

export default function AuthVerify() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) { setStatus('error'); setMsg(t('authVerify.token_not_found')); return }

    fetch(`${API}/auth/verify?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.token) {
          saveSession(data.token, data.email, data.role)
          const role = data.role as string | undefined
          if (role === 'patient') window.location.href = '/patient/portal'
          else window.location.href = '/'
        } else {
          setStatus('error')
          setMsg(data.error ?? t('authVerify.invalid_token'))
        }
      })
      .catch(() => { setStatus('error'); setMsg(t('authVerify.connection_error')) })
  }, [t])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">{t('authVerify.verifying')}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">✕</span>
            </div>
            <p className="font-semibold text-slate-800">{t('authVerify.invalid_link')}</p>
            <p className="text-sm text-slate-500 mt-1">{msg}</p>
            <a href="/" className="mt-4 inline-block text-blue-600 text-sm hover:underline">
              {t('authVerify.back_home')}
            </a>
          </>
        )}
      </div>
    </div>
  )
}
