import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Stethoscope, FilePlus, CheckCircle, Clock, XCircle, AlertCircle, Pencil, Trash2, Camera, Plus, Smile, CalendarClock, Phone, Mail, IdCard, Ban } from 'lucide-react'
import { api } from '@/lib/api'
import { ClinicalRecordForm } from '@/components/clinical/ClinicalRecordForm'
import { ClinicalRecordViewModal } from '@/components/clinical/ClinicalRecordViewModal'
import { PhotoSessionPanel } from '@/components/photos/PhotoSessionPanel'
import { NewSessionModal } from '@/components/photos/NewSessionModal'
import { OdontogramTab } from '@/components/odontogram/OdontogramTab'
import { ConsentViewModal } from '@/components/consents/ConsentViewModal'
import { RevokeConsentModal } from '@/components/consents/RevokeConsentModal'
import { AppointmentModal } from '@/components/agenda/AppointmentModal'
import { treatmentColorStyle } from '@/lib/treatmentColors'
import type { Doctor } from '@consentspro/shared-types'

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  signed:  { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  pending: { icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50' },
  revoked: { icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50' },
  expired: { icon: AlertCircle, color: 'text-slate-400',   bg: 'bg-slate-50' },
}

type Tab = 'history' | 'consents' | 'photos' | 'odontogram' | 'appointments'

function todayDateKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function PatientDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [patient, setPatient]               = useState<any>(null)
  const [consents, setConsents]             = useState<any[]>([])
  const [clinicalRecords, setClinicalRecords] = useState<any[]>([])
  const [photoSessions, setPhotoSessions]   = useState<any[]>([])
  const [appointments, setAppointments]     = useState<any[]>([])
  const [treatments, setTreatments]         = useState<any[]>([])
  const [doctors, setDoctors]               = useState<Doctor[]>([])
  const [clinic, setClinic]                 = useState<any>(null)
  const [loading, setLoading]               = useState(true)
  const [tab, setTab]                       = useState<Tab>('history')
  const [formOpen, setFormOpen]             = useState(false)
  const [editing, setEditing]               = useState<any>(null)
  const [viewingRecord, setViewingRecord]   = useState<any>(null)
  const [newSessionOpen, setNewSessionOpen] = useState(false)
  const [viewingConsent, setViewingConsent] = useState<any>(null)
  const [revokingConsent, setRevokingConsent] = useState<any>(null)
  const [apptModal, setApptModal]           = useState<{ open: boolean; initial?: any }>({ open: false })
  const [allDataOpen, setAllDataOpen]       = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [patients, cs, rs, ps, as, tr, ds, c] = await Promise.all([
        api.get('/patients'),
        api.get('/consents'),
        api.get(`/clinical-records?patientId=${id}`),
        api.get(`/photo-sessions?patientId=${id}`),
        api.get(`/appointments?patient_id=${id}`).catch(() => []),
        api.get('/treatments').catch(() => []),
        api.get('/doctors'),
        api.get('/clinic').catch(() => null),
      ])
      const p = Array.isArray(patients) ? patients.find((x: any) => x.id === id) : null
      if (p) setPatient({ ...p, firstName: p.first_name ?? p.firstName, lastName: p.last_name ?? p.lastName, fullName: p.full_name ?? p.fullName })
      setConsents(Array.isArray(cs) ? cs.filter((c: any) => c.patient_id === id || c.patientId === id) : [])
      setClinicalRecords(Array.isArray(rs) ? rs : [])
      setPhotoSessions(Array.isArray(ps) ? ps : [])
      setAppointments(Array.isArray(as) ? as : [])
      setTreatments(Array.isArray(tr) ? tr : [])
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

  const handleSaveAppointment = async (data: any) => {
    if (apptModal.initial?.id) await api.put(`/appointments/${apptModal.initial.id}`, data)
    else await api.post('/appointments', data)
    await load()
  }

  const handleDeleteAppointment = async () => {
    if (!apptModal.initial?.id) return
    await api.delete(`/appointments/${apptModal.initial.id}`)
    await load()
  }

  const handleRevokeConsent = async (reason: string) => {
    await api.post(`/consents/${revokingConsent.id}/revoke`, { reason })
    await load()
  }

  const openAppointment = (a: any) => setApptModal({
    open: true,
    initial: {
      id: a.id,
      patient_id: a.patient_id,
      doctor_id: a.doctor_id,
      treatment_id: a.treatment_id,
      start_time: a.start_time,
      notes: a.notes,
    },
  })

  const { futureAppointments, pastAppointments } = useMemo(() => {
    const today = todayDateKey()
    const future = appointments.filter(a => a.start_time.slice(0, 10) >= today).sort((a, b) => a.start_time.localeCompare(b.start_time))
    const past = appointments.filter(a => a.start_time.slice(0, 10) < today).sort((a, b) => b.start_time.localeCompare(a.start_time))
    return { futureAppointments: future, pastAppointments: past }
  }, [appointments])

  if (loading) return <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
  if (!patient) return <div className="p-12 text-center text-slate-400">{t('patientDetail.not_found')}</div>

  const firstName = patient.firstName ?? patient.fullName?.split(' ')[0] ?? ''
  const lastName  = patient.lastName  ?? patient.fullName?.split(' ').slice(1).join(' ') ?? ''
  const addrParts = (patient.address ?? '').split('|')

  return (
    <div className="flex flex-col gap-6">
      {/* Back + Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <button onClick={() => navigate('/patients')} className="mt-1 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
            {firstName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{firstName} {lastName}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <IdCard className="w-3.5 h-3.5 flex-shrink-0" />{patient.idDocType ?? patient.id_doc_type} {patient.idDocument ?? patient.id_document}
            </p>
          </div>
        </div>
      </div>

      {/* Patient info card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.date_of_birth')}</p><p className="mt-1 text-slate-700">{patient.dateOfBirth ?? patient.date_of_birth ? new Date(patient.dateOfBirth ?? patient.date_of_birth).toLocaleDateString('es-ES') : '—'}</p></div>
          <div className="col-span-2 md:col-span-2">
            <p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.contact_info')}</p>
            <div className="mt-1 flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-slate-700"><Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{patient.phone || '—'}</span>
              <span className="flex items-center gap-1.5 text-slate-700 truncate"><Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{patient.email || '—'}</span>
            </div>
          </div>
          {patient.allergies && <div className="col-span-2 md:col-span-3"><p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.allergies')}</p><p className="mt-1 text-amber-700 bg-amber-50 rounded px-2 py-1 text-xs">{patient.allergies}</p></div>}
          {patient.medications && <div className="col-span-2 md:col-span-3"><p className="text-xs text-slate-400 uppercase font-semibold">{t('patientDetail.medications')}</p><p className="mt-1 text-slate-700">{patient.medications}</p></div>}
        </div>
        <div className="pt-3 border-t border-slate-100">
          <button onClick={() => setAllDataOpen(true)} className="text-xs font-medium text-blue-600 hover:text-blue-800">
            {t('patientDetail.show_all_data')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-full overflow-x-auto sm:w-fit">
        <TabBtn active={tab === 'history'}      onClick={() => setTab('history')}      icon={<Stethoscope className="w-4 h-4" />}   label={t('patientDetail.tabs.history', { count: clinicalRecords.length })}     activeColor="text-teal-700" />
        <TabBtn active={tab === 'appointments'} onClick={() => setTab('appointments')} icon={<CalendarClock className="w-4 h-4" />} label={t('patientDetail.tabs.appointments', { count: appointments.length })}   activeColor="text-blue-700" />
        <TabBtn active={tab === 'photos'}       onClick={() => setTab('photos')}       icon={<Camera className="w-4 h-4" />}        label={t('patientDetail.tabs.photos', { count: photoSessions.length })}       activeColor="text-violet-700" />
        <TabBtn active={tab === 'consents'}     onClick={() => setTab('consents')}     icon={<FileText className="w-4 h-4" />}      label={t('patientDetail.tabs.consents', { count: consents.length })}          activeColor="text-blue-700" />
        <TabBtn active={tab === 'odontogram'}   onClick={() => setTab('odontogram')}   icon={<Smile className="w-4 h-4" />}         label={t('patientDetail.tabs.odontogram')}                                      activeColor="text-cyan-700" />
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
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setViewingRecord(r)}
                  className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-teal-200 transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        {r.date ? new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                      </span>
                      {r.reason_for_visit && <p className="mt-1.5 font-semibold text-slate-800">{r.reason_for_visit}</p>}
                      {r.doctor?.name && <p className="text-xs text-slate-400 mt-0.5">{t('patientDetail.doctor_prefix', { name: r.doctor.name })}</p>}
                    </div>
                    <div className="flex gap-1">
                      <span onClick={e => { e.stopPropagation(); setEditing(r); setFormOpen(true) }} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50"><Pencil className="w-4 h-4" /></span>
                      <span onClick={e => { e.stopPropagation(); handleDeleteClinical(r.id) }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></span>
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
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointments tab */}
      {tab === 'appointments' && (
        <div className="flex flex-col gap-5">
          {appointments.length === 0 ? (
            <EmptyState icon={<CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-20" />} text={t('patientDetail.no_appointments')} />
          ) : (
            <>
              {futureAppointments.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('patientDetail.upcoming_appointments')}</h3>
                  <div className="flex flex-col gap-2">
                    {futureAppointments.map(a => <AppointmentRow key={a.id} appt={a} onClick={() => openAppointment(a)} />)}
                  </div>
                </div>
              )}
              {pastAppointments.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('patientDetail.past_appointments')}</h3>
                  <div className="flex flex-col gap-2">
                    {pastAppointments.map(a => <AppointmentRow key={a.id} appt={a} past onClick={() => openAppointment(a)} />)}
                  </div>
                </div>
              )}
            </>
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
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-shadow flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => setViewingConsent(c)}
                  className="text-left min-w-0 flex-1"
                >
                  <p className="font-semibold text-slate-800 truncate">{c.template?.treatmentType ?? c.template?.treatment_type ?? '—'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.doctor?.name ?? '—'} · {c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES') : '—'}</p>
                </button>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    <Icon className="w-3 h-3" />{t(`patientDetail.status.${statusKey}`)}
                  </span>
                  {statusKey === 'signed' && (
                    <button
                      type="button"
                      onClick={() => setRevokingConsent(c)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title={t('consents.revoke')}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
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

      {viewingRecord && (
        <ClinicalRecordViewModal
          record={viewingRecord}
          onEdit={() => { setEditing(viewingRecord); setViewingRecord(null); setFormOpen(true) }}
          onClose={() => setViewingRecord(null)}
        />
      )}

      {newSessionOpen && (
        <NewSessionModal
          patients={[patient]}
          doctors={doctors}
          onSave={handleCreateSession}
          onClose={() => setNewSessionOpen(false)}
        />
      )}

      {viewingConsent && (
        <ConsentViewModal
          consent={viewingConsent}
          clinic={clinic}
          onClose={() => setViewingConsent(null)}
        />
      )}

      {revokingConsent && (
        <RevokeConsentModal
          patientName={patient?.fullName ?? ''}
          onConfirm={handleRevokeConsent}
          onClose={() => setRevokingConsent(null)}
        />
      )}

      {apptModal.open && (
        <AppointmentModal
          initial={apptModal.initial}
          patients={[patient]}
          doctors={doctors}
          treatments={treatments}
          onSave={handleSaveAppointment}
          onDelete={handleDeleteAppointment}
          onClose={() => setApptModal({ open: false })}
        />
      )}

      {allDataOpen && (
        <PatientAllDataModal patient={patient} addrParts={addrParts} onClose={() => setAllDataOpen(false)} />
      )}
    </div>
  )
}

function AppointmentRow({ appt, past, onClick }: { appt: any; past?: boolean; onClick: () => void }) {
  const { t } = useTranslation()
  const colorStyle = treatmentColorStyle(appt.treatment?.color)
  const start = new Date(appt.start_time)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl p-4 border flex items-center justify-between gap-3 transition-shadow hover:shadow-md ${past ? 'opacity-60 grayscale' : ''}`}
      style={colorStyle}
    >
      <div className="min-w-0">
        <p className="font-semibold truncate">{appt.treatment?.name ?? t('appointmentCalendar.treatment_fallback')}</p>
        <p className="text-xs opacity-80 mt-0.5">
          {start.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} · {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {appt.doctor?.name && <p className="text-xs opacity-70 mt-0.5">{t('appointmentCalendar.doctor_prefix', { name: appt.doctor.name })}</p>}
      </div>
    </button>
  )
}

function PatientAllDataModal({ patient, addrParts, onClose }: { patient: any; addrParts: string[]; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t('patientDetail.all_data_title')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label={t('patientDetail.date_of_birth')} value={patient.dateOfBirth ?? patient.date_of_birth ? new Date(patient.dateOfBirth ?? patient.date_of_birth).toLocaleDateString('es-ES') : '—'} />
          <Field label={t('patientDetail.id_document')} value={`${patient.idDocType ?? patient.id_doc_type ?? ''} ${patient.idDocument ?? patient.id_document ?? ''}`.trim() || '—'} />
          <Field label={t('patientDetail.phone')} value={patient.phone || '—'} />
          <Field label={t('patientDetail.email')} value={patient.email || '—'} />
          <Field label={t('patientDetail.blood_type')} value={patient.bloodType ?? patient.blood_type ?? '—'} />
          <Field label={t('patientDetail.address')} value={addrParts[0] ? `${addrParts[0]}, ${addrParts[1] ?? ''}` : '—'} />
          {patient.allergies && <Field label={t('patientDetail.allergies')} value={patient.allergies} highlight />}
          {patient.medications && <Field label={t('patientDetail.medications')} value={patient.medications} />}
        </div>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label, activeColor }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; activeColor: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 whitespace-nowrap ${active ? `bg-white ${activeColor} shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
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
