import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { SignatureCanvas } from '@/components/signature/SignatureCanvas'
import type { Patient, Doctor, ConsentTemplate } from '@consentspro/shared-types'
import { useLanguageStore } from '@/store/languageStore'
import { useConsentWithLegal } from '@/hooks/useConsentWithLegal'

interface ConsentModalProps {
  initialPatientId?: string
  continueRecord?: any
  onClose: () => void
  onSaved: () => void
}

type Step = 'form' | 'preview' | 'sign_doctor' | 'sign_patient' | 'done'

export function ConsentModal({ initialPatientId, continueRecord, onClose, onSaved }: ConsentModalProps) {
  const { t } = useTranslation()
  const { currentLanguage } = useLanguageStore()

  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [templates, setTemplates] = useState<ConsentTemplate[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [sede, setSede] = useState(continueRecord?.sede ?? '')

  const [patientId, setPatientId] = useState(continueRecord?.patient_id ?? continueRecord?.patientId ?? initialPatientId ?? '')
  const [doctorId, setDoctorId] = useState(continueRecord?.doctor_id ?? continueRecord?.doctorId ?? '')
  const [templateId, setTemplateId] = useState(continueRecord?.template_id ?? continueRecord?.templateId ?? '')
  const [step, setStep] = useState<Step>(continueRecord ? 'sign_doctor' : 'form')
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [consentId, setConsentId] = useState(continueRecord?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)

  const selectedTemplate = templates.find(t => t.id === templateId)
  const legalData = useConsentWithLegal(
    selectedTemplate ?? { contentJson: {}, legalClausesJson: {} }
  )

  useEffect(() => {
    api.get('/clinic').then((c: any) => {
      const b = c?.branches ?? []
      setBranches(Array.isArray(b) ? b : [])
    }).catch(() => {})

    Promise.all([
      api.get('/patients'),
      api.get('/doctors'),
      api.get('/consents/templates'),
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
        sede: sede || null,
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
      })
      setStep('done')
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
            const labels = ['Datos', 'Revisión', 'Firma doctor', 'Firma paciente', 'Hecho']
            const cur = steps.indexOf(step)
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
              {branches.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sede</label>
                  <select
                    value={sede}
                    onChange={e => setSede(e.target.value)}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sede principal</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.name}>{b.name}{b.address ? ` — ${b.address}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('consents.patient')}</label>
                <select
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar paciente…</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{(p as any).firstName && (p as any).lastName ? `${(p as any).firstName} ${(p as any).lastName}` : p.fullName}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('consents.doctor')}</label>
                <select
                  value={doctorId}
                  onChange={e => setDoctorId(e.target.value)}
                  className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar doctor…</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('consents.treatment')}</label>
                <select
                  value={templateId}
                  onChange={e => setTemplateId(e.target.value)}
                  className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar tratamiento…</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.treatmentType}</option>)}
                </select>
              </div>

              {selectedTemplate && (
                <button
                  onClick={handleTranslate}
                  disabled={translating}
                  className="self-start text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 disabled:opacity-50"
                >
                  {translating ? 'Traduciendo…' : t('consents.translate')}
                </button>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">{t('common.cancel')}</button>
                <button
                  onClick={handleCreate}
                  disabled={!patientId || !doctorId || !templateId || saving}
                  className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium"
                >
                  {saving ? t('common.loading') : 'Continuar'}
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
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Doctor responsable</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{doc.name}</p>
                      {doc.specialty && <p className="text-xs text-slate-500">{doc.specialty}</p>}
                    </div>
                    {license && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Nº Colegiado</p>
                        <p className="text-sm font-semibold text-slate-700">{license}</p>
                      </div>
                    )}
                  </div>
                ) : null
              })()}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Marco Legal — {legalData.jurisdiction}</p>
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
                  <p className="text-xs font-semibold text-orange-700">⚠ Este país requiere testigo para la firma</p>
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
                <button onClick={() => setStep('form')} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">← Atrás</button>
                <button
                  onClick={() => setStep('sign_doctor')}
                  disabled={!acceptedLegal}
                  className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium"
                >
                  Firmar →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Doctor signature */}
          {step === 'sign_doctor' && (
            <div className="flex flex-col gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-blue-800">Firma del doctor</p>
                <p className="text-xs text-blue-600 mt-0.5">El doctor debe firmar primero para validar el consentimiento</p>
              </div>
              <p className="text-sm text-slate-600">{t('signature.instructions')}</p>
              <SignatureCanvas onSave={(dataUrl) => handleDoctorSign(dataUrl)} />
              <button onClick={() => setStep('preview')} className="self-start text-xs text-slate-500 hover:text-slate-700">← Volver</button>
            </div>
          )}

          {/* STEP 4: Patient signature */}
          {step === 'sign_patient' && (
            <div className="flex flex-col gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-emerald-800">Firma del paciente</p>
                <p className="text-xs text-emerald-600 mt-0.5">El paciente debe firmar para confirmar que ha leído y acepta el consentimiento</p>
              </div>
              <p className="text-sm text-slate-600">{t('signature.instructions')}</p>
              <SignatureCanvas onSave={handlePatientSign} />
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">✓</div>
              <h3 className="text-xl font-bold text-slate-800">Consentimiento firmado</h3>
              <p className="text-sm text-slate-500">El documento ha sido firmado y registrado correctamente.</p>
              <p className="text-xs text-slate-400">{legalData.footerLegal}</p>
              <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
