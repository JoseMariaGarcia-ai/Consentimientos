import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SignatureCanvas } from '@/components/signature/SignatureCanvas'
import { useConsentWithLegal } from '@/hooks/useConsentWithLegal'
import { useLanguageStore } from '@/store/languageStore'
import { deviceApi } from '@/lib/deviceAuth'

type Step = 'preview' | 'sign_doctor' | 'sign_patient' | 'done'

interface KioskConsentSignerProps {
  consent: any
  onDone: () => void
}

export function KioskConsentSigner({ consent, onDone }: KioskConsentSignerProps) {
  const { t } = useTranslation()
  const { setLanguage } = useLanguageStore()
  const [step, setStep] = useState<Step>('preview')
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [saving, setSaving] = useState(false)

  // The consent was presented to the patient in a specific language on the
  // desktop — the kiosk must show the same one, regardless of whatever
  // locale this shared tablet happens to default to.
  useEffect(() => {
    if (consent?.language) setLanguage(consent.language)
  }, [consent?.language, setLanguage])

  const template = consent.template ?? { contentJson: {}, legalClausesJson: {} }
  const legalData = useConsentWithLegal(template)

  const handleDoctorSign = async (dataUrl: string) => {
    setSaving(true)
    try {
      await deviceApi.post(`/signing-kiosk/consents/${consent.id}/doctor-signature`, { signature_data_url: dataUrl })
      setStep('sign_patient')
    } finally {
      setSaving(false)
    }
  }

  const handlePatientSign = async (dataUrl: string, points: any[]) => {
    setSaving(true)
    try {
      await deviceApi.post(`/signing-kiosk/consents/${consent.id}/patient-signature`, {
        signature_data_url: dataUrl,
        biometric_json: JSON.stringify(points),
        client_timestamp: new Date().toISOString(),
      })
      setStep('done')
      setTimeout(onDone, 2500)
    } finally {
      setSaving(false)
    }
  }

  const patientName = consent.patient?.full_name
    ?? [consent.patient?.first_name, consent.patient?.last_name].filter(Boolean).join(' ')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-[#0D1B2E] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="text-lg font-extrabold text-white">
          Consents<span className="text-[#C9A84C]">Pro</span>
        </div>
        <span className="text-sm text-slate-300">{patientName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-2xl flex flex-col gap-4">

          {step === 'preview' && (
            <>
              {consent.doctor?.name && (
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('consents.responsible_doctor')}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{consent.doctor.name}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-1">{t('consents.legal_framework_title', { jurisdiction: legalData.jurisdiction })}</p>
                <p className="text-xs text-blue-600">{legalData.applicableLaw}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 max-h-[45vh] overflow-y-auto text-slate-700 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-sm [&_li]:mb-1">
                {legalData.title && <h3 className="font-semibold text-slate-800 mb-3">{legalData.title}</h3>}
                {legalData.introText && <div dangerouslySetInnerHTML={{ __html: legalData.introText }} />}
                {legalData.body && <div dangerouslySetInnerHTML={{ __html: legalData.body }} />}
              </div>

              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <p className="text-xs text-amber-700 leading-relaxed">{legalData.rightsText}</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer bg-white border border-slate-200 rounded-xl p-4">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={e => setAcceptedLegal(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded accent-blue-600"
                />
                <span className="text-sm text-slate-700">{t('signature.legal_notice')}</span>
              </label>

              <button
                onClick={() => setStep('sign_doctor')}
                disabled={!acceptedLegal}
                className="py-4 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 disabled:opacity-40"
              >
                {t('consents.sign_arrow')}
              </button>
            </>
          )}

          {step === 'sign_doctor' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-blue-800">{t('consents.doctor_signature_title')}</p>
                <p className="text-xs text-blue-600 mt-0.5">{t('consents.doctor_signature_notice')}</p>
              </div>
              <p className="text-sm text-slate-600">{t('signature.instructions')}</p>
              <SignatureCanvas onSave={dataUrl => handleDoctorSign(dataUrl)} />
            </>
          )}

          {step === 'sign_patient' && (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-emerald-800">{t('consents.patient_signature_title')}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{t('consents.patient_signature_notice')}</p>
              </div>
              <p className="text-sm text-slate-600">{t('signature.instructions')}</p>
              <SignatureCanvas onSave={handlePatientSign} />
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl">✓</div>
              <h3 className="text-2xl font-bold text-slate-800">{t('consents.signed_title')}</h3>
              <p className="text-sm text-slate-500">{t('consents.signed_description')}</p>
            </div>
          )}

          {saving && <p className="text-xs text-slate-400 text-center">{t('common.saving')}</p>}
        </div>
      </div>
    </div>
  )
}
