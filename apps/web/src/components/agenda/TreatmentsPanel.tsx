import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Stethoscope, Clock, Euro, X } from 'lucide-react'
import { api } from '@/lib/api'

interface Treatment {
  id: string
  name: string
  duration_minutes: number
  price: number
}

function TreatmentForm({ initial, onSave, onClose }: { initial: Partial<Treatment>; onSave: (d: any) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    duration_minutes: initial.duration_minutes ?? 30,
    price: initial.price ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    try {
      await onSave({ ...initial, ...form, duration_minutes: Number(form.duration_minutes), price: Number(form.price) })
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{initial.id ? 'Editar tratamiento' : 'Nuevo tratamiento'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Nombre <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Toxina botulínica"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Duración (min)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value as any }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Precio (€)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value as any }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function TreatmentsPanel() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ open: boolean; treatment: Partial<Treatment> | null }>({ open: false, treatment: null })

  const load = async () => {
    setLoading(true)
    try { setTreatments(await api.get('/treatments')) } catch { setTreatments([]) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSave = async (data: any) => {
    if (data.id) await api.put(`/treatments/${data.id}`, data)
    else await api.post('/treatments', data)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este tratamiento?')) return
    await api.delete(`/treatments/${id}`)
    await load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Tratamientos</h2>
          <p className="text-sm text-slate-500">Duración y precio de cada tratamiento para poder agendar citas</p>
        </div>
        <button
          onClick={() => setForm({ open: true, treatment: {} })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />Nuevo tratamiento
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Cargando…</div>
      ) : treatments.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-2">
          <Stethoscope className="w-10 h-10 opacity-20" />
          <p>No hay tratamientos creados todavía</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {treatments.map(t => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{t.name}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setForm({ open: true, treatment: t })} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{t.duration_minutes} min</span>
                <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5" />{Number(t.price).toFixed(2)} €</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {form.open && (
        <TreatmentForm
          initial={form.treatment ?? {}}
          onSave={handleSave}
          onClose={() => setForm({ open: false, treatment: null })}
        />
      )}
    </div>
  )
}
