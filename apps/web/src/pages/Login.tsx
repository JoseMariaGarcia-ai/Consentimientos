import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LanguageSelector } from '@/components/language/LanguageSelector'
import { useTranslation } from 'react-i18next'
import { Fingerprint, Loader2 } from 'lucide-react'
import {
  browserSupportsWebAuthn,
  hasBiometricRegistered,
  authenticateWithBiometric,
} from '@/lib/webauthn'
import { BiometricPrompt } from '@/components/auth/BiometricPrompt'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bioLoading, setBioLoading] = useState(false)
  const [error, setError] = useState('')
  const [supportsWebAuthn, setSupportsWebAuthn] = useState(false)
  const [hasBio, setHasBio] = useState(false)
  const [showBioPrompt, setShowBioPrompt] = useState(false)

  useEffect(() => {
    setSupportsWebAuthn(browserSupportsWebAuthn())
    setHasBio(hasBiometricRegistered())

    // After magic link redirect, check if we should prompt for biometric setup
    const hash = window.location.hash
    if (hash.includes('access_token') && !hasBiometricRegistered() && browserSupportsWebAuthn()) {
      setShowBioPrompt(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  const handleBiometric = async () => {
    if (!email) { setError('Introduce tu email primero'); return }
    setBioLoading(true)
    setError('')
    const ok = await authenticateWithBiometric(email)
    if (!ok) setError('Verificación biométrica fallida. Usa el Magic Link.')
    setBioLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      {/* Language selector */}
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {t('login.email', 'Email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@clinica.es"
                required
                className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Biometric button — shown if device supports it and has registered */}
            {supportsWebAuthn && hasBio && (
              <button
                type="button"
                onClick={handleBiometric}
                disabled={bioLoading}
                className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {bioLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Fingerprint className="w-4 h-4" />}
                {bioLoading ? 'Verificando…' : 'Entrar con huella / Face ID'}
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 bg-[#0a2342] text-white rounded-xl font-medium hover:bg-[#1a4a7a] disabled:opacity-50 transition-colors"
            >
              {loading
                ? t('common.loading', 'Enviando…')
                : t('login.magic_link', 'Entrar con Magic Link')}
            </button>

            {supportsWebAuthn && !hasBio && (
              <p className="text-xs text-slate-400 text-center">
                Tras tu primer acceso podrás activar Face ID / huella
              </p>
            )}
          </form>
        )}

        <p className="text-xs text-slate-400 text-center mt-6">
          {t('login.footer', 'Consentimientos digitales válidos · Ley 41/2002 · RGPD')}
        </p>
      </div>

      {showBioPrompt && <BiometricPrompt onClose={() => setShowBioPrompt(false)} />}
    </div>
  )
}
