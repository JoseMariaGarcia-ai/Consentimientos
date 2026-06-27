import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SignatureCanvas } from '@/components/signature/SignatureCanvas'
import { useLanguageStore } from '@/store/languageStore'

const API = import.meta.env.VITE_API_URL ?? ''
type PortalStep = 'loading' | 'auth' | 'review' | 'sign' | 'done' | 'error'

export default function PatientPortal() {
  const { t } = useTranslation()
  const { currentLanguage } = useLanguageStore()
  const [step, setStep] = useState<PortalStep>('loading')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [consent, setConsent] = useState<any>(null)
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)

  const consentId = window.location.pathname.split('/portal/')[1]

  useEffect(() => {
    // Check for token in URL (after magic link redirect)
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      fetch(`${API}/auth/verify?token=${token}`)
        .then(r => r.json())
        .then(data => {
          if (data.token) loadConsent(data.token)
          else setStep('auth')
        })
        .catch(() => setStep('auth'))
    } else {
      setStep('auth')
    }
  }, [])

  const loadConsent = async (token: string) => {
    try {
      const r = await fetch(`${API}/verify/${consentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await r.json()
      if (r.ok) { setConsent(data); setStep('review') }
      else setStep('error')
    } catch { setStep('error') }
  }

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const redirectUrl = `${window.location.href}?portalEmail=${email}`
    await fetch(`${API}/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo: redirectUrl }),
    })
    setSent(true)
  }

  const handleSign = async (dataUrl: string, points: any[]) => {
    if (!consent) return
    setSaving(true)
    try {
      const encoder = new TextEncoder()
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(consent.id + dataUrl))
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      await fetch(`${API}/signature/${consent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_data_url: dataUrl, biometric_json: points, document_hash: hash, client_timestamp: new Date().toISOString() }),
      })
      setStep('done')
    } finally { setSaving(false) }
  }

  const lang = consent?.language ?? currentLanguage
  const content = consent?.content_json?.[lang] ?? consent?.content_json?.['es-ES']
  const legal = consent?.legal_clauses_json?.[lang] ?? consent?.legal_clauses_json?.['es-ES']

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#1A2B4A] to-[#2563EB] px-6 py-5 text-white">
          <div className="text-xl font-bold">Consents<span className="text-yellow-400 underline underline-offset-2">Pro</span></div>
          <div className="text-xs text-white/70 mt-0.5">Consentimientos Digitales · Huella Digital</div>
        </div>
        <div className="px-6 py-6">
          {step === 'loading' && <div className="text-center text-slate-400 py-8">{t('common.loading')}</div>}

          {step === 'auth' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-slate-800">Acceso al documento</h2>
              <p className="text-sm text-slate-500">Introduce tu email para recibir un enlace de acceso seguro.</p>
              {sent ? (
                <div className="text-center text-emerald-600 py-4">
                  <p className="font-medium">Enlace enviado</p>
                  <p className="text-sm mt-1">Revisa tu correo y haz clic en el enlace para continuar.</p>
                </div>
              ) : (
                <form onSubmit={handleRequestLink} className="flex flex-col gap-3">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
                    className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" className="py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
                    Enviar enlace de acceso
                  </button>
                </form>
              )}
            </div>
          )}

          {step === 'review' && consent && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-slate-800">{content?.title ?? 'Consentimiento Informado'}</h2>
              {legal && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700">{legal.jurisdiction} — {legal.applicableLaw}</p>
                </div>
              )}
              <div className="border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto text-sm text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: (legal?.introText ? `<p class="mb-3">${legal.introText}</p>` : '') + (content?.body ?? '') }} />
              {legal?.rightsText && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">{legal.rightsText}</div>
              )}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-slate-700">He leído y acepto este consentimiento informado</span>
              </label>
              <button onClick={() => setStep('sign')} disabled={!accepted}
                className="py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40">
                Proceder a la firma →
              </button>
            </div>
          )}

          {step === 'sign' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-slate-800">{t('signature.title')}</h2>
              <p className="text-sm text-slate-500">{t('signature.instructions')}</p>
              <SignatureCanvas onSave={handleSign} />
              {saving && <p className="text-xs text-center text-slate-400">Guardando firma…</p>}
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">✓</div>
              <h3 className="text-xl font-bold text-slate-800">Firma completada</h3>
              <p className="text-sm text-slate-500">Su consentimiento ha sido firmado y registrado de forma segura.</p>
              {legal?.footerLegal && <p className="text-xs text-slate-400 text-center">{legal.footerLegal}</p>}
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8 text-red-500">
              <p className="font-medium">Documento no encontrado</p>
              <p className="text-sm mt-1 text-slate-400">El enlace puede haber expirado o ser incorrecto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
