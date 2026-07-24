import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Stethoscope, Mail, CheckCircle2, Circle, Send, Loader2, CalendarRange, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { ALL_MODULES } from '@/lib/modules'

interface Doctor {
  id: string
  name: string
  specialty?: string | null
  email?: string | null
  photo_url?: string | null
  app_user_id?: string | null
}

interface PermissionsResponse {
  hasAccount: boolean
  permissions: Record<string, boolean>
  canViewAllAgendas: boolean
  canViewAllPatients: boolean
}

// Gestión por clínica de qué secciones ve cada doctor y si puede ver la
// agenda de toda la clínica o solo la suya — aislado por clínica: solo
// opera sobre GET /doctors (ya scoped a la clínica del que llama) y sobre
// los endpoints /doctors/:id/permissions e /invite, protegidos en el
// backend con requireClinicaAdmin.
export function DoctorPermissionsPanel() {
  const { t } = useTranslation()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<Record<string, string>>({})
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/doctors')
      setDoctors(Array.isArray(data) ? data : [])
    } catch {
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleInvite = async (doctor: Doctor) => {
    setInvitingId(doctor.id)
    setInviteError(e => ({ ...e, [doctor.id]: '' }))
    try {
      await api.post(`/doctors/${doctor.id}/invite`, {})
      await load()
    } catch (err: any) {
      setInviteError(e => ({ ...e, [doctor.id]: err.message ?? t('doctorPermissions.invite_error') }))
    } finally {
      setInvitingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">{t('doctorPermissions.intro')}</p>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Stethoscope className="w-10 h-10 opacity-20" />
            <p>{t('doctorPermissions.no_doctors')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {doctors.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3.5 flex-wrap">
                {d.photo_url ? (
                  <img src={d.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{d.name}</p>
                  {d.email && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />{d.email}
                    </p>
                  )}
                  {inviteError[d.id] && <p className="text-xs text-red-500 mt-0.5">{inviteError[d.id]}</p>}
                </div>

                {d.app_user_id ? (
                  <>
                    <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />{t('doctorPermissions.status_active')}
                    </span>
                    <button
                      onClick={() => setEditingDoctor(d)}
                      className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex-shrink-0"
                    >
                      {t('doctorPermissions.manage_permissions')}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
                      <Circle className="w-3.5 h-3.5" />{t('doctorPermissions.status_no_account')}
                    </span>
                    <button
                      onClick={() => handleInvite(d)}
                      disabled={invitingId === d.id || !d.email}
                      title={!d.email ? (t('doctorPermissions.no_email') as string) : undefined}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
                    >
                      {invitingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {t('doctorPermissions.invite')}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editingDoctor && (
        <DoctorPermissionsModal
          doctor={editingDoctor}
          onClose={() => setEditingDoctor(null)}
          onSaved={() => { setEditingDoctor(null); load() }}
        />
      )}
    </div>
  )
}

function DoctorPermissionsModal({ doctor, onClose, onSaved }: { doctor: Doctor; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [canViewAllAgendas, setCanViewAllAgendas] = useState(false)
  const [canViewAllPatients, setCanViewAllPatients] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/doctors/${doctor.id}/permissions`).then((data: PermissionsResponse) => {
      setPermissions(data.permissions ?? {})
      setCanViewAllAgendas(!!data.canViewAllAgendas)
      setCanViewAllPatients(!!data.canViewAllPatients)
    }).catch(() => setError(t('doctorPermissions.load_error') as string)).finally(() => setLoading(false))
  }, [doctor.id, t])

  const toggle = (key: string) => setPermissions(p => ({ ...p, [key]: !p[key] }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await api.put(`/doctors/${doctor.id}/permissions`, { permissions, canViewAllAgendas, canViewAllPatients })
      onSaved()
    } catch (err: any) {
      setError(err.message ?? t('doctorPermissions.save_error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{doctor.name}</h2>
            <p className="text-xs text-slate-400">{t('doctorPermissions.modal_subtitle')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : (
          <div className="px-6 py-5 flex flex-col gap-4">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer">
              <input
                type="checkbox"
                checked={canViewAllAgendas}
                onChange={e => setCanViewAllAgendas(e.target.checked)}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <CalendarRange className="w-4 h-4 text-blue-500" />{t('doctorPermissions.view_all_agendas')}
                </span>
                <span className="text-xs text-slate-500">{t('doctorPermissions.view_all_agendas_hint')}</span>
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer">
              <input
                type="checkbox"
                checked={canViewAllPatients}
                onChange={e => setCanViewAllPatients(e.target.checked)}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" />{t('doctorPermissions.view_all_patients')}
                </span>
                <span className="text-xs text-slate-500">{t('doctorPermissions.view_all_patients_hint')}</span>
              </span>
            </label>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('doctorPermissions.sections_title')}</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_MODULES.map(m => (
                  <label key={m.key} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={permissions[m.key] ?? false}
                      onChange={() => toggle(m.key)}
                    />
                    {t(m.labelKey)}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {error}</div>
            )}
          </div>
        )}

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">{t('common.cancel')}</button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
