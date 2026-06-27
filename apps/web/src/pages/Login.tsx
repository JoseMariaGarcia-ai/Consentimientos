import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '@/components/language/LanguageSelector'
import { Loader2 } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || '/.netlify/functions'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleSubmit = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError('Introduce un email válido')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar el enlace')
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector variant="light" />
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0a2342] mb-4">
            <span className="text-white font-bold text-xl">CP</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Consents<span className="text-amber-500 underline underline-offset-2">Pro</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Consentimientos Digitales · eIDAS</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800">{t('login.check_email', 'Revisa tu email')}</p>
            <p className="text-sm text-slate-500 mt-1">
              {t('login.magic_link_sent', 'Te hemos enviado un Magic Link a')} <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {t('login.email', 'Email')}
              </label>
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="tu@clinica.es"
                className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="py-2.5 bg-[#0a2342] text-white rounded-xl font-medium hover:bg-[#1a4a7a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t('common.loading', 'Enviando…') : t('login.magic_link', 'Entrar con Magic Link')}
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-6">
          {t('login.footer', 'Consentimientos digitales válidos · Ley 41/2002 · RGPD')}
        </p>
      </div>
    </div>
  )
}
