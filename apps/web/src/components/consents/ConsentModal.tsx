import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useWelcomeMedia } from '@/context/WelcomeMediaContext'
import { SignatureCanvas } from '@/components/signature/SignatureCanvas'
import type { Patient, Doctor, ConsentTemplate } from '@consentspro/shared-types'
import { useLanguageStore } from '@/store/languageStore'
import { useConsentWithLegal } from '@/hooks/useConsentWithLegal'
import { TEMPLATE_CATEGORIES, FAVORITE_CATEGORY } from '@/lib/templateCategories'
import { hasEducationalImageClause, hasMarketingImageClause } from '@/lib/imageAuthClause'
import { PatientCombobox } from '@/components/patients/PatientCombobox'
import { PatientForm } from '@/components/patients/PatientForm'
import { TreatmentCombobox } from '@/components/consents/TreatmentCombobox'
import { generateAndEmailConsentPdf } from '@/lib/consentPdfUpload'

interface ConsentModalProps {
  initialPatientId?: string
  continueRecord?: any
  onClose: () => void
  onSaved: () => void
}

type Step = 'form' | 'preview' | 'sign_doctor' | 'sign_patient' | 'sent_to_tablet' | 'done'

export function ConsentModal({ initialPatientId, continueRecord, onClose, onSaved }: ConsentModalProps) {
  const { trigger: triggerWelcome } = useWelcomeMedia()
  const { t } = useTranslation()
  const { currentLanguage } = useLanguageStore()

  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [templates, setTemplates] = useState<ConsentTemplate[]>([])

  const [patientId, setPatientId] = useState(continueRecord?.patient_id ?? continueRecord?.patientId ?? initialPatientId ?? '')
  const [doctorId, setDoctorId] = useState(continueRecord?.doctor_id ?? continueRecord?.doctorId ?? '')
  const [templateId, setTemplateId] = useState(continueRecord?.template_id ?? continueRecord?.templateId ?? '')
  const [step, setStep] = useState<Step>(continueRecord ? 'sign_doctor' : 'form')
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [imageAuthEducational, setImageAuthEducational] = useState(false)
  const [imageAuthMarketing, setImageAuthMarketing] = useState(false)
  const [consentId, setConsentId] = useState(continueRecord?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [handoffError, setHandoffError] = useState('')
  const [showNewPatientModal, setShowNewPatientModal] = useState(false)

  const selectedTemplate = templates.find(t => t.id === templateId)
  const templatesByCategory = useMemo(() => {
    const byCategory = new Map<string, ConsentTemplate[]>()
    for (const tmpl of templates) {
      const cats = [tmpl.category ?? 'medicina_estetica', ...(tmpl.extraCategories ?? [])]
      for (const cat of cats) {
        if (!byCategory.has(cat)) byCategory.set(cat, [])
        byCategory.get(cat)!.push(tmpl)
      }
    }
    const rest = TEMPLATE_CATEGORIES
      .map(cat => [cat, byCategory.get(cat) ?? []] as const)
      .filter(([, items]) => items.length > 0)
    // "Más usados" (marcados con la estrella en Plantillas, aislado por
    // clínica — template.isFavorite ya viene filtrado por la clínica de
    // este usuario) siempre primero, por encima incluso de su categoría
    // real — así se llega antes al tratamiento que más se repite en el
    // día a día de la clínica.
    const favorites = templates.filter(tmpl => tmpl.isFavorite)
    return favorites.length > 0 ? [[FAVORITE_CATEGORY, favorites] as const, ...rest] : rest
  }, [templates])
  const legalData = useConsentWithLegal(
    selectedTemplate ?? { contentJson: {}, legalClausesJson: {} }
  )

  useEffect(() => {
    Promise.all([
      api.get('/patients').catch(() => []),
      api.get('/doctors').catch(() => []),
      api.get('/consents/templates').catch(() => []),
    ]).then(([p, d, t]) => {
      setPatients(Array.isArray(p) ? p.map((x: any) => ({
        ...x,
        firstName: x.firstName ?? x.first_name,
        lastName:  x.lastName  ?? x.last_name,
        fullName:  x.fullName  ?? x.full_name ?? [x.first_name, x.last_name].filter(Boolean).join(' '),
      })) : [])
      setDoctors(Array.isArray(d) ? d : [])
      setTemplates(Array.isArray(t) ? t : [])
    })
  }, [])

  const handleCreatePatient = async (data: any) => {
    const created = await api.post('/patients', data)
    setPatients(ps => [...ps, {
      ...created,
      firstName: created.firstName ?? created.first_name,
      lastName:  created.lastName  ?? created.last_name,
      fullName:  created.fullName  ?? created.full_name ?? [created.first_name, created.last_name].filter(Boolean).join(' '),
    }])
    setPatientId(created.id)
  }

  const handleCreate = async () => {
    if (!patientId || !doctorId || !templateId) return
    setSaving(true)
    try {
      const record = await api.post('/consents', {
        patientId,
        doctorId,
        templateId,
        language: currentLanguage,
        jurisdiction: legalData.jurisdiction,
        status: 'pending',
      })
      setConsentId(record.id)
      setStep('preview')
    } finally {
      setSaving(false)
    }
  }

  const handleTranslate = async () => {
    if (!selectedTemplate) return
    setTranslating(true)
    try {
      await api.post('/translate', {
        templateId: selectedTemplate.id,
        spanishTitle: selectedTemplate.contentJson['es-ES']?.title ?? '',
        spanishBody: selectedTemplate.contentJson['es-ES']?.body ?? '',
      })
    } finally {
      setTranslating(false)
    }
  }

  const handleSendToTablet = async () => {
    setSaving(true)
    setHandoffError('')
    try {
      await api.post('/consent-handoff', { consent_id: consentId })
      setStep('sent_to_tablet')
    } catch (e: any) {
      setHandoffError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // While waiting on the tablet, poll for completion instead of the doctor
  // touching this screen again — the desktop just watches and auto-advances.
  useEffect(() => {
    if (step !== 'sent_to_tablet' || !consentId) return
    const interval = setInterval(async () => {
      try {
        const data = await api.get(`/consent-handoff/${consentId}`)
        if (data?.consentStatus === 'signed') {
          clearInterval(interval)
          setStep('done')
          triggerWelcome('consent')
          generateAndEmailConsentPdf(consentId)
          onSaved()
        }
      } catch {
        // keep polling — a transient network error shouldn't abort the wait
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [step, consentId])

  const handleDoctorSign = async (dataUrl: string) => {
    setSaving(true)
    try {
      await api.post(`/signature/${consentId}/doctor`, { signature_data_url: dataUrl })
      setStep('sign_patient')
    } finally {
      setSaving(false)
    }
  }

  const handlePatientSign = async (dataUrl: string, points: any[]) => {
    setSaving(true)
    try {
      await api.post(`/signature/${consentId}`, {
        signature_data_url: dataUrl,
        biometric_json: JSON.stringify(points),
        client_timestamp: new Date().toISOString(),
        image_auth_educational: imageAuthEducational,
        image_auth_marketing: imageAuthMarketing,
      })
      setStep('done')
      triggerWelcome('consent')
      generateAndEmailConsentPdf(consentId)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t('consents.add')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        <div className="px-6 py-5">
          {/* Step indicator */}
          {(() => {
            const steps: Step[] = ['form', 'preview', 'sign_doctor', 'sign_patient', 'done']
            const labels = t('consents.step_labels', { returnObjects: true }) as string[]
            const cur = steps.indexOf(step === 'sent_to_tablet' ? 'sign_doctor' : step)
            return (
              <div className="flex items-center gap-1 mb-6">
                {steps.map((s, i) => (
                  <div key={s} className={`flex items-center gap-1 ${i > 0 ? 'flex-1' : ''}`}>
                    {i > 0 && <div className={`flex-1 h-px ${cur >= i ? 'bg-blue-400' : 'bg-slate-200'}`} />}
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        cur === i ? 'bg-blue-600 text-white' : cur > i ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                      }`}>{i + 1}</div>
                      <span className="text-[9px] text-slate-400 hidden sm:block">{labels[i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* STEP 1: Form */}
          {step === 'form' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('consents.patient')}</label>
                <PatientCombobox
                  patients={patients}
                  value={patientId}
                  onChange={setPatientId}
                  onCreateNew={() => setShowNewPatientModal(true)}
                  placeholder={t('consents.select_patient')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('consents.doctor')}</label>
                <select
                  value={doctorId}
                  onChange={e => setDoctorId(e.target.value)}
                  className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('consents.select_doctor')}</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('consents.treatment')}</label>
                <TreatmentCombobox
                  templatesByCategory={templatesByCategory}
                  value={templateId}
                  onChange={setTemplateId}
                  placeholder={t('consents.select_treatment')}
                />
              </div>

              {selectedTemplate && (
                <button
                  onClick={handleTranslate}
                  disabled={translating}
                  className="self-start text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 disabled:opacity-50"
                >
                  {translating ? t('consents.translating') : t('consents.translate')}
                </button>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">{t('common.cancel')}</button>
                <button
                  onClick={handleCreate}
                  disabled={!patientId || !doctorId || !templateId || saving}
                  className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium"
                >
                  {saving ? t('common.loading') : t('consents.continue')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preview legal */}
          {step === 'preview' && selectedTemplate && (
            <div className="flex flex-col gap-4">
              {/* Doctor info */}
              {(() => {
                const doc = doctors.find(d => d.id === doctorId)
                const license = (doc as any)?.licenseNumber ?? (doc as any)?.license_number
                return doc ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t('consents.responsible_doctor')}</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{doc.name}</p>
                      {doc.specialty && <p className="text-xs text-slate-500">{doc.specialty}</p>}
                    </div>
                    {license && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">{t('doctors.license')}</p>
                        <p className="text-sm font-semibold text-slate-700">{license}</p>
                      </div>
                    )}
                  </div>
                ) : null
              })()}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-1">{t('consents.legal_framework_title', { jurisdiction: legalData.jurisdiction })}</p>
                <p className="text-xs text-blue-600">{legalData.applicableLaw}</p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 max-h-64 overflow-y-auto text-slate-700 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1 [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-sm [&_li]:mb-1 [&_em]:italic [&_strong]:font-semibold">
                {legalData.title && <h3 className="font-semibold text-slate-800 mb-3">{legalData.title}</h3>}
                {legalData.introText && (
                  <div dangerouslySetInnerHTML={{ __html: legalData.introText }} />
                )}
                {legalData.body && (
                  <div dangerouslySetInnerHTML={{ __html: legalData.body }} />
                )}
              </div>

              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <p className="text-xs text-amber-700 leading-relaxed">{legalData.rightsText}</p>
              </div>

              {legalData.witnessRequired && (
                <div className="border border-orange-200 bg-orange-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-orange-700">⚠ {t('consents.witness_required_notice')}</p>
                </div>
              )}

              {(hasEducationalImageClause(legalData.body) || hasMarketingImageClause(legalData.body)) && (
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('consents.image_auth_title')}</p>
                  {hasEducationalImageClause(legalData.body) && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imageAuthEducational}
                        onChange={e => setImageAuthEducational(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-blue-600"
                      />
                      <span className="text-sm text-slate-700">{t('consents.image_auth_educational')}</span>
                    </label>
                  )}
                  {hasMarketingImageClause(legalData.body) && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imageAuthMarketing}
                        onChange={e => setImageAuthMarketing(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-blue-600"
                      />
                      <span className="text-sm text-slate-700">{t('consents.image_auth_marketing')}</span>
                    </label>
                  )}
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={e => setAcceptedLegal(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-blue-600"
                />
                <span className="text-sm text-slate-700">{t('signature.legal_notice')}</span>
              </label>

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <button onClick={() => setStep('form')} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">{t('consents.back')}</button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendToTablet}
                    disabled={saving}
                    className="px-4 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 font-medium"
                  >
                    {t('consents.send_to_tablet')}
                  </button>
                  <button
                    onClick={() => setStep('sign_doctor')}
                    disabled={!acceptedLegal}
                    className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium"
                  >
                    {t('consents.sign_arrow')}
                  </button>
                </div>
              </div>
              {handoffError && <p className="text-sm text-red-500 text-right">{handoffError}</p>}
            </div>
          )}

          {/* STEP 3: Doctor signature */}
          {step === 'sign_doctor' && (
            <div className="flex flex-col gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-blue-800">{t('consents.doctor_signature_title')}</p>
                <p className="text-xs text-blue-600 mt-0.5">{t('consents.doctor_signature_notice')}</p>
              </div>
              <p className="text-sm text-slate-600">{t('signature.instructions')}</p>
              <SignatureCanvas onSave={(dataUrl) => handleDoctorSign(dataUrl)} />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">{t('consents.or')}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <button
                onClick={handleSendToTablet}
                disabled={saving}
                className="flex items-center justify-center gap-2 py-2.5 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
              >
                {t('consents.send_to_tablet')}
              </button>
              {handoffError && <p className="text-sm text-red-500">{handoffError}</p>}

              <button onClick={() => setStep('preview')} className="self-start text-xs text-slate-500 hover:text-slate-700">{t('consents.back_to_preview')}</button>
            </div>
          )}

          {/* STEP 3b: Waiting for the paired tablet to finish both signatures */}
          {step === 'sent_to_tablet' && (
            <div className="text-center py-10 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <h3 className="text-base font-semibold text-slate-800">{t('consents.waiting_tablet_title')}</h3>
              <p className="text-sm text-slate-500 max-w-sm">{t('consents.waiting_tablet_description')}</p>
              <button onClick={() => setStep('sign_doctor')} className="text-xs text-slate-400 hover:text-slate-600">
                {t('consents.sign_here_instead')}
              </button>
            </div>
          )}

          {/* STEP 4: Patient signature */}
          {step === 'sign_patient' && (
            <div className="flex flex-col gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-emerald-800">{t('consents.patient_signature_title')}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{t('consents.patient_signature_notice')}</p>
              </div>
              <p className="text-sm text-slate-600">{t('signature.instructions')}</p>
              <SignatureCanvas onSave={handlePatientSign} />
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">✓</div>
              <h3 className="text-xl font-bold text-slate-800">{t('consents.signed_title')}</h3>
              <p className="text-sm text-slate-500">{t('consents.signed_description')}</p>
              <p className="text-xs text-slate-400">{legalData.footerLegal}</p>
              <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                {t('consents.close')}
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewPatientModal && (
        <PatientForm
          onSave={handleCreatePatient}
          onClose={() => setShowNewPatientModal(false)}
        />
      )}
    </div>
  )
}
