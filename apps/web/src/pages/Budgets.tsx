import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, Plus, Pencil, Trash2, FilterX, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { BudgetModal } from '@/components/budgets/BudgetModal'
import { BudgetView } from '@/components/budgets/BudgetView'
import { PatientCombobox } from '@/components/patients/PatientCombobox'

const EMPTY_FILTERS = { date_from: '', date_to: '', patient_id: '', q: '' }

export default function Budgets() {
  const { t } = useTranslation()
  const [budgets, setBudgets] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [clinic, setClinic] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [modal, setModal] = useState<{ open: boolean; initial?: any }>({ open: false })
  const [viewing, setViewing] = useState<any | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.patient_id) params.set('patient_id', filters.patient_id)
      if (filters.q) params.set('q', filters.q)
      const data = await api.get(`/budgets?${params.toString()}`)
      setBudgets(Array.isArray(data) ? data : [])
    } catch {
      setBudgets([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([
      api.get('/patients').catch(() => []),
      api.get('/treatments').catch(() => []),
      api.get('/clinic').catch(() => ({})),
    ]).then(([p, tr, c]) => {
      setPatients(Array.isArray(p) ? p : [])
      setTreatments(Array.isArray(tr) ? tr : [])
      setClinic(c)
    })
  }, [])

  const handleSave = async (data: any) => {
    if (modal.initial?.id) await api.put(`/budgets/${modal.initial.id}`, data)
    else await api.post('/budgets', data)
    await load()
  }

  const deleteBudget = async (id: string) => {
    await api.delete(`/budgets/${id}`)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('budgets.confirm_delete'))) return
    await deleteBudget(id)
  }

  const openNew = () => setModal({ open: true })
  const openEdit = (b: any) => setModal({
    open: true,
    initial: {
      id: b.id,
      patient_id: b.patient_id,
      items: b.items,
      notes: b.notes,
      valid_until: b.valid_until,
    },
  })

  const openView = async (b: any) => {
    const full = await api.get(`/budgets/${b.id}`)
    setViewing(full)
  }

  const patientName = (p: any) => p ? (p.full_name ?? p.fullName ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) : '—'
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
  const fmtMoney = (n: number) => (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('budgets.title')}</h1>
            <p className="text-sm text-slate-500">{t('budgets.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />{t('budgets.new_budget')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('budgets.from')}</label>
          <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('budgets.to')}</label>
          <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('budgets.patient')}</label>
          <PatientCombobox
            patients={patients}
            value={filters.patient_id}
            onChange={id => setFilters(f => ({ ...f, patient_id: id }))}
            placeholder={t('budgets.all')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('budgets.search')}</label>
          <input value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} placeholder={t('budgets.search_placeholder')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <button
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
        >
          <FilterX className="w-4 h-4" />{t('budgets.clear_filters')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : budgets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Receipt className="w-10 h-10 opacity-20" />
            <p>{t('budgets.no_results')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">{t('budgets.col_number')}</th>
                  <th className="px-4 py-3 font-semibold">{t('budgets.col_date')}</th>
                  <th className="px-4 py-3 font-semibold">{t('budgets.col_patient')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('budgets.col_total')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('budgets.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {budgets.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{b.budget_number}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(b.created_at)}</td>
                    <td className="px-4 py-3 text-slate-600">{patientName(b.patient)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">{fmtMoney(b.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openView(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
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
        <BudgetModal
          initial={modal.initial}
          patients={patients}
          treatments={treatments}
          onSave={handleSave}
          onDelete={modal.initial?.id ? () => deleteBudget(modal.initial.id) : undefined}
          onClose={() => setModal({ open: false })}
          onPatientCreated={p => setPatients(ps => [...ps, p])}
        />
      )}

      {viewing && (
        <BudgetView budget={viewing} clinic={clinic} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
