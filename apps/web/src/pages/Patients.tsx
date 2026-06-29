import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus, Pencil, Trash2, FileText, Images } from 'lucide-react'
import { api } from '@/lib/api'
import { PatientForm } from '@/components/patients/PatientForm'
import { PatientGallery } from '@/components/patients/PatientGallery'
import type { Patient } from '@consentspro/shared-types'
import { useNavigate } from 'react-router-dom'

function age(dob?: string) {
  if (!dob) return '—'
  const d = new Date(dob)
  return Math.floor((Date.now() - d.getTime()) / 31557600000) + ' años'
}

export default function Patients() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [galleryPatient, setGalleryPatient] = useState<Patient | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/patients')
      setPatients(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return patients.filter(p =>
      p.fullName?.toLowerCase().includes(q) ||
      p.idDocument?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    )
  }, [patients, search])

  const handleSave = async (data: Partial<Patient>) => {
    if (editing?.id) {
      await api.put(`/patients/${editing.id}`, data)
    } else {
      await api.post('/patients', data)
    }
    setFormOpen(false)
    setEditing(null)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return
    setDeleting(id)
    try {
      await api.delete(`/patients/${id}`)
      setPatients(ps => ps.filter(p => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const openNew = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (p: Patient) => { setEditing(p); setFormOpen(true) }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('patients.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{patients.length} registrados</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          {t('patients.add')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('patients.search')}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">{t('patients.no_results')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[t('patients.name'), t('patients.dob'), t('patients.id_doc'), t('patients.phone'), t('patients.email'), ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.fullName}</td>
                    <td className="px-4 py-3 text-slate-500">{age(p.dateOfBirth)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded mr-1">{p.idDocType}</span>
                      {p.idDocument}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.phone}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setGalleryPatient(p)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50"
                          title={t('patients.gallery')}
                        >
                          <Images className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/consents?patient=${p.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                          title={t('consents.title')}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-40"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <PatientForm
          initial={editing ?? {}}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}

      {galleryPatient && (
        <PatientGallery
          patientId={galleryPatient.id}
          patientName={galleryPatient.fullName}
          onClose={() => setGalleryPatient(null)}
        />
      )}
    </div>
  )
}
