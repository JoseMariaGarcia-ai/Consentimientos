import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Stethoscope, FilePlus, CheckCircle, Clock, XCircle, AlertCircle, Pencil, Trash2, Camera, Plus, Smile } from 'lucide-react'
import { api } from '@/lib/api'
import { ClinicalRecordForm } from '@/components/clinical/ClinicalRecordForm'
import { PhotoSessionPanel } from '@/components/photos/PhotoSessionPanel'
import { NewSessionModal } from '@/components/photos/NewSessionModal'
import { OdontogramTab } from '@/components/odontogram/OdontogramTab'
import type { Doctor } from '@consentspro/shared-types'

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  signed:  { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  pending: { icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50' },
  revoked: { icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50' },
  expired: { icon: AlertCircle, color: 'text-slate-400',   bg: 'bg-slate-50' },
}

type Tab = 'history' | 'consents' | 'photos' | 'odontogram'

export default function PatientDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [patient, setPatient]               = useState<any>(null)
  const [consents, setConsents]             = useState<any[]>([])
  const [clinicalRecords, setClinicalRecords] = useState<any[]>([])
  const [photoSessions, setPhotoSessions]   = useState<any[]>([])
  const [doctors, setDoctors]               = useState<Doctor[]>([])
  const [clinic, setClinic]                 = useState<any>(null)
  const [loading, setLoading]               = useState(true)
  const [tab, setTab]                       = useState<Tab>('history')
  const [formOpen, setFormOpen]             = useState(false)
  const [editing, setEditing]               = useState<any>(null)
  const [newSessionOpen, setNewSessionOpen] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [patients, cs, rs, ps, ds, c] = await Promise.all([
        api.get('/patients'),
        api.get('/consents'),
        api.get(`/clinical-records?patientId=${id}`),
        api.get(`/photo-sessions?patientId=${id}`),
        api.get('/doctors'),
        api.get('/clinic').catch(() => null),
      ])
      const p = Array.isArray(patients) ? patients.find((x: any) => x.id === id) : null
      if (p) setPatient({ ...p, firstName: p.first_name ?? p.firstName, lastName: p.last_name ?? p.lastName, fullName: p.full_name ?? p.fullName })
      setConsents(Array.isArray(cs) ? cs.filter((c: any) => c.patient_id === id || c.patientId === id) : [])
      setClinicalRecords(Array.isArray(rs) ? rs : [])
      setPhotoSessions(Array.isArray(ps) ? ps : [])
      setDoctors(Array.isArray(ds) ? ds : [])
      setClinic(c)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleSaveClinical = async (data: any) => {
    if (editing?.id) await api.put(`/clinical-records/${editing.id}`, data)
    else await api.post('/clinical-records', { ...data, patient_id: id })
    await load()
  }

  const handleDeleteClinical = async (rid: string) => {
    if (!confirm(t('patientDetail.confirm_delete_clinical'))) return
    await api.delete(`/clinical-records/${rid}`)
    setClinicalRecords(rs => rs.filter(r => r.id !== rid))
  }

  const handleCreateSession = async (data: any) => {
    const session = await api.post('/photo-sessions', { ...data, patient_id: id })
    setPhotoSessions(prev => [session, ...prev])
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm(t('patientDetail.confirm_delete_session'))) return
    await api.delete(`/photo-sessions/${sessionId}`)
    setPhotoSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  if (loading) return <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
  if (!patient) return <div className="p-12 text-center text-slate-400">{t('patientDetail.not_found')}</div>

  const firstName = patient.firstName ?? patient.fullName?.split(' ')[0] ?? ''
  const lastName  = patient.lastName  ?? patient.fullName?.split(' ').slice(1).join(' ') ?? ''
  const addrParts = (patient.address ?? '').split('|')

  return (
    <div className="flex flex-col gap-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/patients')} className="mt-1 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl">
            {firstName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{firstName} {lastName}</h1>
            <p className="text-sm text-slate-500">{patient.idDocType ?? patient.id_doc_type} {patient.idDocument ?? patient.id_document} · {patient.phone}</p>
          </div>
        </div>
      </div>

      {/* Patient info card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.date_of_birth')}</p><p className="mt-1 text-slate-700">{patient.dateOfBirth ?? patient.date_of_birth ? new Date(patient.dateOfBirth ?? patient.date_of_birth).toLocaleDateString('es-ES') : '—'}</p></div>
        <div><p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.email')}</p><p className="mt-1 text-slate-700">{patient.email ?? '—'}</p></div>
        <div><p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.blood_type')}</p><p className="mt-1 text-slate-700">{patient.bloodType ?? patient.blood_type ?? '—'}</p></div>
        <div><p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.address')}</p><p className="mt-1 text-slate-700">{addrParts[0] ? `${addrParts[0]}, ${addrParts[1] ?? ''}` : '—'}</p></div>
        {patient.allergies && <div className="col-span-2"><p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.allergies')}</p><p className="mt-1 text-amber-700 bg-amber-50 rounded px-2 py-1 text-xs">{patient.allergies}</p></div>}
        {patient.medications && <div className="col-span-2"><p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.medications')}</p><p className="mt-1 text-slate-700">{patient.medications}</p></div>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <TabBtn active={tab === 'history'}  onClick={() => setTab('history')}  icon={<Stethoscope className="w-4 h-4" />} label={t('patientDetail.tabs.history', { count: clinicalRecords.length })} activeColor="text-teal-700" />
        <TabBtn active={tab === 'photos'}   onClick={() => setTab('photos')}   icon={<Camera className="w-4 h-4" />}      label={t('patientDetail.tabs.photos', { count: photoSessions.length })}                activeColor="text-violet-700" />
        <TabBtn active={tab === 'consents'} onClick={() => setTab('consents')} icon={<FileText className="w-4 h-4" />}    label={t('patientDetail.tabs.consents', { count: consents.length })}           activeColor="text-blue-700" />
        <TabBtn active={tab === 'odontogram'} onClick={() => setTab('odontogram')} icon={<Smile className="w-4 h-4" />}  label={t('patientDetail.tabs.odontogram')}                                       activeColor="text-cyan-700" />
      </div>

      {/* Clinical Records tab */}
      {tab === 'history' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => { setEditing(null); setFormOpen(true) }} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 shadow-sm">
              <FilePlus className="w-4 h-4" />
              {t('patientDetail.new_clinical_record')}
            </button>
          </div>
          {clinicalRecords.length === 0 ? (
            <EmptyState icon={<Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-20" />} text={t('patientDetail.no_clinical_records')} />
          ) : (
            <div className="flex flex-col gap-3">
              {clinicalRecords.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        {r.date ? new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                      </span>
                      {r.reason_for_visit && <p className="mt-1.5 font-semibold text-slate-800">{r.reason_for_visit}</p>}
                      {r.doctor?.name && <p className="text-xs text-slate-400 mt-0.5">{t('patientDetail.doctor_prefix', { name: r.doctor.name })}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(r); setFormOpen(true) }} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteClinical(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {r.anamnesis && <Field label={t('patientDetail.fields.anamnesis')} value={r.anamnesis} />}
                    {r.allergies && <Field label={t('patientDetail.fields.allergies')} value={r.allergies} highlight />}
                    {r.current_medications && <Field label={t('patientDetail.fields.current_medications')} value={r.current_medications} />}
                    {r.physical_exam && <Field label={t('patientDetail.fields.physical_exam')} value={r.physical_exam} />}
                    {r.diagnosis && <Field label={t('patientDetail.fields.diagnosis')} value={r.diagnosis} />}
                    {r.treatment_plan && <Field label={t('patientDetail.fields.treatment_plan')} value={r.treatment_plan} />}
                    {r.notes && <Field label={t('patientDetail.fields.notes')} value={r.notes} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photos tab */}
      {tab === 'photos' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => setNewSessionOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 shadow-sm">
              <Plus className="w-4 h-4" />
              {t('patientDetail.new_photo_session')}
            </button>
          </div>
          {photoSessions.length === 0 ? (
            <EmptyState icon={<Camera className="w-10 h-10 mx-auto mb-3 opacity-20" />} text={t('patientDetail.no_photo_sessions')} />
          ) : (
            <div className="flex flex-col gap-3">
              {photoSessions.map(session => (
                <PhotoSessionPanel
                  key={session.id}
                  session={session}
                  onChange={updated => setPhotoSessions(prev => prev.map(s => s.id === updated.id ? updated : s))}
                  onDelete={() => handleDeleteSession(session.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Consents tab */}
      {tab === 'consents' && (
        <div className="flex flex-col gap-3">
          {consents.length === 0 ? (
            <EmptyState icon={<FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />} text={t('patientDetail.no_consents')} />
          ) : consents.map(c => {
            const statusKey = STATUS_CONFIG[c.status] ? c.status : 'pending'
            const cfg = STATUS_CONFIG[statusKey]
            const Icon = cfg.icon
            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{c.template?.treatmentType ?? c.template?.treatment_type ?? '—'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.doctor?.name ?? '—'} · {c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES') : '—'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                  <Icon className="w-3 h-3" />{t(`patientDetail.status.${statusKey}`)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Odontograma tab */}
      {tab === 'odontogram' && (
        <OdontogramTab patientId={id!} patient={patient} clinic={clinic} doctors={doctors} />
      )}

      {formOpen && (
        <ClinicalRecordForm
          initial={editing ? { ...editing, patient_id: id } : { patient_id: id }}
          patients={[patient]}
          doctors={doctors}
          onSave={handleSaveClinical}
          onClose={() => setFormOpen(false)}
        />
      )}

      {newSessionOpen && (
        <NewSessionModal
          patients={[patient]}
          onSave={handleCreateSession}
          onClose={() => setNewSessionOpen(false)}
        />
      )}
    </div>
  )
}

function TabBtn({ active, onClick, icon, label, activeColor }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; activeColor: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? `bg-white ${activeColor} shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
    >
      {icon}{label}
    </button>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      {icon}<p>{text}</p>
    </div>
  )
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase">{label}</p>
      <p className={`mt-0.5 text-sm ${highlight ? 'text-amber-700 bg-amber-50 rounded px-2 py-0.5' : 'text-slate-700'}`}>{value}</p>
    </div>
  )
}
