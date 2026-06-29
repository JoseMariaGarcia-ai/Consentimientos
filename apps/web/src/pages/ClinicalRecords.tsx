import { useState, useEffect, useMemo } from 'react'
import { Search, FilePlus, Pencil, Trash2, Stethoscope } from 'lucide-react'
import { api } from '@/lib/api'
import { ClinicalRecordForm } from '@/components/clinical/ClinicalRecordForm'
import type { Doctor } from '@consentspro/shared-types'

export default function ClinicalRecords() {
  const [records, setRecords] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, p, d] = await Promise.all([
        api.get('/clinical-records'),
        api.get('/patients'),
        api.get('/doctors'),
      ])
      setRecords(Array.isArray(r) ? r : [])
      setPatients(Array.isArray(p) ? p.map((x: any) => ({
        ...x,
        firstName: x.first_name ?? x.firstName,
        lastName:  x.last_name  ?? x.lastName,
        fullName:  x.full_name  ?? x.fullName ?? [x.first_name, x.last_name].filter(Boolean).join(' '),
      })) : [])
      setDoctors(Array.isArray(d) ? d : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return records.filter(r =>
      (r.patient?.full_name ?? '').toLowerCase().includes(q) ||
      (r.diagnosis ?? '').toLowerCase().includes(q) ||
      (r.reason_for_visit ?? '').toLowerCase().includes(q)
    )
  }, [records, search])

  const handleSave = async (data: any) => {
    if (editing?.id) await api.put(`/clinical-records/${editing.id}`, data)
    else await api.post('/clinical-records', data)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta historia clínica?')) return
    await api.delete(`/clinical-records/${id}`)
    setRecords(rs => rs.filter(r => r.id !== id))
  }

  const openNew = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (r: any) => { setEditing(r); setFormOpen(true) }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Historias Clínicas</h1>
            <p className="text-sm text-slate-500 mt-0.5">{records.length} registros</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 shadow-sm"
        >
          <FilePlus className="w-4 h-4" />
          Nueva historia
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por paciente, diagnóstico, motivo…"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-20" />
            No hay historias clínicas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Paciente', 'Fecha', 'Motivo de consulta', 'Diagnóstico', 'Doctor', ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => {
                  const p = r.patient
                  const patientName = p ? (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.full_name ?? '—') : '—'
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{patientName}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {r.date ? new Date(r.date).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.reason_for_visit ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.diagnosis ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{r.doctor?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <ClinicalRecordForm
          initial={editing ?? {}}
          patients={patients}
          doctors={doctors}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}
