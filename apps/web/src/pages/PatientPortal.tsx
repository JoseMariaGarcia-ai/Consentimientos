import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { SignatureCanvas } from '@/components/signature/SignatureCanvas'
import { useLanguageStore } from '@/store/languageStore'

// Public page accessed via Magic Link from email
// Route: /portal/:consentId
// Linked from notification email sent to patient

type PortalStep = 'loading' | 'auth' | 'review' | 'sign' | 'done' | 'error'

interface ConsentData {
  id: string
  status: string
  language: string
  template: { contentJson: Record<string, any>; legalClausesJson: Record<string, any> }
  patient: { fullName: string }
  doctor: { name: string }
}

export default function PatientPortal() {
  const { t } = useTranslation()
  const { currentLanguage } = useLanguageStore()
  const [step, setStep] = useState<PortalStep>('loading')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [consent, setConsent] = useState<ConsentData | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Extract consentId from URL path /portal/:id
  const consentId = window.location.pathname.split('/portal/')[1]

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && consentId) {
        const { data } = await supabase
          .from('consent_records')
          .select('*, template:consent_templates(*), patient:patients(full_name), doctor:doctors(name)')
          .eq('id', consentId)
          .single()
        if (data) { setConsent(data as any); setStep('review') }
        else setStep('error')
      } else {
        setStep('auth')
      }
    })
  }, [])

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    setSent(true)
  }

  const handleSign = async (dataUrl: string, points: any[]) => {
    if (!consent) return
    setSaving(true)
    try {
      const lang = consent.language ?? currentLanguage
      const docContent = consent.template?.contentJson?.[lang]?.body ?? ''

      // Hash document (client-side SHA-256)
      const encoder = new TextEncoder()
      const data = encoder.encode(JSON.stringify({ consentId: consent.id, patientId: consent.patient, documentContent: docContent }))
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

      await supabase.from('consent_records').update({
        signature_data_url: dataUrl,
        biometric_json: points,
        document_hash: hash,
        client_timestamp: new Date().toISOString(),
        status: 'signed',
        signed_at: new Date().toISOString(),
      }).eq('id', consent.id)

      await supabase.from('audit_logs').insert({
        consent_id: consent.id,
        log_json: { action: 'SIGNED_BY_PATIENT', hash, language: lang, pointCount: points.length },
      })

      setStep('done')
    } finally {
      setSaving(false)
    }
  }

  const lang = consent?.language ?? currentLanguage
  const content = consent?.template?.contentJson?.[lang] ?? consent?.template?.contentJson?.['es-ES']
  const legal = consent?.template?.legalClausesJson?.[lang] ?? consent?.template?.legalClausesJson?.['es-ES']

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Brand header */}
        <div className="bg-gradient-to-r from-[#1A2B4A] to-[#2563EB] px-6 py-5 text-white">
          <div className="text-xl font-bold">
            Consents<span className="text-yellow-400 underline underline-offset-2">Pro</span>
          </div>
          <div className="text-xs text-white/70 mt-0.5">Consentimientos Digitales · Huella Digital</div>
        </div>

        <div className="px-6 py-6">
          {step === 'loading' && (
            <div className="text-center text-slate-400 py-8">{t('common.loading')}</div>
          )}

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
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="submit" className="py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
                    Enviar enlace de acceso
                  </button>
                </form>
              )}
            </div>
          )}

          {step === 'review' && consent && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{content?.title ?? 'Consentimiento Informado'}</h2>
                <p className="text-xs text-slate-500 mt-1">Médico: {consent.doctor?.name}</p>
              </div>

              {legal && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700">{legal.jurisdiction} — {legal.applicableLaw}</p>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto text-sm text-slate-600 leading-relaxed">
                {legal?.introText && <p className="mb-3">{legal.introText}</p>}
                {content?.body}
              </div>

              {legal?.rightsText && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  {legal.rightsText}
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-slate-700">He leído y acepto este consentimiento informado</span>
              </label>

              <button
                onClick={() => setStep('sign')}
                disabled={!accepted}
                className="py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40"
              >
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
