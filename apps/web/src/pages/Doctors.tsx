import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, Pencil, Trash2, ShieldCheck, Stethoscope, Phone } from 'lucide-react'
import { api } from '@/lib/api'
import { DoctorForm } from '@/components/doctors/DoctorForm'
import type { Doctor } from '@consentspro/shared-types'

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  doctor: 'bg-blue-100 text-blue-700',
  receptionist: 'bg-emerald-100 text-emerald-700',
}

export default function Doctors() {
  const { t } = useTranslation()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Doctor | null>(null)

  const normalize = (d: any): Doctor => ({
    ...d,
    clinicId:      d.clinicId      ?? d.clinic_id,
    licenseNumber: d.licenseNumber ?? d.license_number,
    createdAt:     d.createdAt     ?? d.created_at,
  })

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/doctors')
      setDoctors(Array.isArray(data) ? data.map(normalize) : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (data: Partial<Doctor>) => {
    if (editing?.id) await api.put(`/doctors/${editing.id}`, data)
    else await api.post('/doctors', data)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return
    await api.delete(`/doctors/${id}`)
    setDoctors(ds => ds.filter(d => d.id !== id))
  }

  const openNew = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (d: Doctor) => { setEditing(d); setFormOpen(true) }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('doctors.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('doctors.count_registered', { count: doctors.length })}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          {t('doctors.add')}
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">{t('doctors.no_results')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors.map(d => {
            const parts = (d.name ?? '').trim().split(/\s+/)
            const firstName = parts[0] ?? ''
            const lastName = parts.slice(1).join(' ')
            return (
            <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                  {firstName.charAt(0)}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLORS[d.role] ?? 'bg-slate-100 text-slate-600'}`}>
                  {t(`doctors.roles.${d.role}`)}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800">{firstName}</h3>
              {lastName && <p className="text-sm font-medium text-slate-700">{lastName}</p>}
              {d.specialty && <p className="text-sm text-slate-500 mt-0.5">{d.specialty}</p>}
              {d.licenseNumber && <p className="text-xs text-slate-400 mt-1">{t('doctors.license_display', { number: d.licenseNumber })}</p>}
              {(d as any).phone && <p className="text-xs text-slate-400 mt-0.5">{(d as any).phone}</p>}
              <p className="text-xs text-slate-400 mt-1 truncate">{d.email}</p>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => openEdit(d)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600">
                  <Pencil className="w-3.5 h-3.5" />{t('common.edit')}
                </button>
                <button onClick={() => handleDelete(d.id)} className="flex items-center justify-center p-1.5 border border-slate-300 rounded-lg hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <DoctorForm initial={editing ?? {}} onSave={handleSave} onClose={() => setFormOpen(false)} />
      )}
    </div>
  )
}
