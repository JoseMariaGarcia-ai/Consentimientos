import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Syringe, Plus, Pencil, Trash2, FilterX, PenLine, FileCheck, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { ToxinModal } from '@/components/toxin/ToxinModal'
import { ToxinPdfButton } from '@/components/toxin/ToxinPdfButton'

const EMPTY_FILTERS = { date_from: '', date_to: '', doctor_id: '', patient_id: '', lot_number: '' }

export default function Toxina() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [clinic, setClinic] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [modal, setModal] = useState<{ open: boolean; initial?: any }>({ open: false })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.doctor_id) params.set('doctor_id', filters.doctor_id)
      if (filters.patient_id) params.set('patient_id', filters.patient_id)
      if (filters.lot_number) params.set('lot_number', filters.lot_number)
      const data = await api.get(`/toxin?${params.toString()}`)
      setRecords(Array.isArray(data) ? data : [])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([
      api.get('/patients').catch(() => []),
      api.get('/doctors').catch(() => []),
      api.get('/clinic').catch(() => ({})),
    ]).then(([p, d, c]) => {
      setPatients(Array.isArray(p) ? p : [])
      setDoctors(Array.isArray(d) ? d : [])
      setClinic(c)
    })
  }, [])

  const handleSave = async (data: any) => {
    if (modal.initial?.id) await api.put(`/toxin/${modal.initial.id}`, data)
    else await api.post('/toxin', data)
    await load()
  }

  const deleteRecord = async (id: string) => {
    await api.delete(`/toxin/${id}`)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro de toxina?')) return
    await deleteRecord(id)
  }

  const openNew = () => setModal({ open: true })
  const openEdit = (r: any) => setModal({
    open: true,
    initial: {
      id: r.id,
      patient_id: r.patient_id,
      doctor_id: r.doctor_id,
      application_date: r.application_date,
      brand_name: r.brand_name,
      lot_number: r.lot_number,
      expiry_date: r.expiry_date,
      manufacturer: r.manufacturer,
      treated_zones: r.treated_zones,
      vials_opened: r.vials_opened,
      consent_id: r.consent_id,
      doctor_signature: r.doctor_signature,
      doctor_signed_at: r.doctor_signed_at,
      notes: r.notes,
    },
  })

  const patientName = (p: any) => p ? (p.full_name ?? p.fullName ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) : '—'
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
  const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const selectedDoctor = doctors.find(d => d.id === filters.doctor_id)
  const selectedPatient = patients.find(p => p.id === filters.patient_id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Syringe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Control de Toxina</h1>
            <p className="text-sm text-slate-500">Trazabilidad de lotes de toxina botulínica</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToxinPdfButton
            clinic={clinic}
            records={records}
            filters={{
              date_from: filters.date_from || undefined,
              date_to: filters.date_to || undefined,
              doctor_name: selectedDoctor?.name,
              patient_name: patientName(selectedPatient),
              lot_number: filters.lot_number || undefined,
            }}
          />
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />Nuevo registro
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Desde</label>
          <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Hasta</label>
          <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Doctor</label>
          <select value={filters.doctor_id} onChange={e => setFilters(f => ({ ...f, doctor_id: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">Todos</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Paciente</label>
          <select value={filters.patient_id} onChange={e => setFilters(f => ({ ...f, patient_id: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">Todos</option>
            {patients.map(p => <option key={p.id} value={p.id}>{patientName(p)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Nº de lote</label>
          <input value={filters.lot_number} onChange={e => setFilters(f => ({ ...f, lot_number: e.target.value }))} placeholder="Buscar lote…"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <button
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
        >
          <FilterX className="w-4 h-4" />Limpiar filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando…</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Syringe className="w-10 h-10 opacity-20" />
            <p>No hay registros de toxina con estos filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Doctor</th>
                  <th className="px-4 py-3 font-semibold">Nombre comercial</th>
                  <th className="px-4 py-3 font-semibold">Lote</th>
                  <th className="px-4 py-3 font-semibold">Caducidad</th>
                  <th className="px-4 py-3 font-semibold">Zonas</th>
                  <th className="px-4 py-3 font-semibold text-right">Unidades</th>
                  <th className="px-4 py-3 font-semibold text-center">Firma</th>
                  <th className="px-4 py-3 font-semibold text-center">CI</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDateTime(r.application_date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{patientName(r.patient)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.doctor?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.brand_name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.lot_number}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(r.expiry_date)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={(r.treated_zones ?? []).map((z: any) => z.zone).join(', ')}>
                      {(r.treated_zones ?? []).map((z: any) => z.zone).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">{r.total_units} U</td>
                    <td className="px-4 py-3 text-center" title={r.doctor_signature ? 'Firmado' : 'Sin firma'}>
                      {r.doctor_signature
                        ? <PenLine className="w-4 h-4 text-emerald-600 inline" />
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center" title={r.consent_id ? 'Con consentimiento vinculado' : 'Sin consentimiento vinculado'}>
                      {r.consent_id
                        ? <FileCheck className="w-4 h-4 text-emerald-600 inline" />
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/toxina/${r.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
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

      {modal.open && (
        <ToxinModal
          initial={modal.initial}
          patients={patients}
          doctors={doctors}
          onSave={handleSave}
          onDelete={modal.initial?.id ? () => deleteRecord(modal.initial.id) : undefined}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
