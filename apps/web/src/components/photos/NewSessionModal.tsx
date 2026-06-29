import { useState } from 'react'
import { Camera } from 'lucide-react'

interface Props {
  patients: any[]
  onSave: (data: { patient_id: string; name: string; notes: string; session_date: string }) => Promise<void>
  onClose: () => void
}

export function NewSessionModal({ patients, onSave, onClose }: Props) {
  const now = new Date()
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const [form, setForm] = useState({ patient_id: '', name: '', notes: '', session_date: localISO })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patient_id) { setError('Selecciona un paciente'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...form, session_date: new Date(form.session_date).toISOString() })
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-slate-800">Nueva sesión fotográfica</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Paciente <span className="text-red-500">*</span></label>
            <select
              value={form.patient_id}
              onChange={e => set('patient_id', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Seleccionar paciente…</option>
              {patients.map(p => {
                const name = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : (p.fullName ?? '')
                return <option key={p.id} value={p.id}>{name}</option>
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Nombre de la sesión</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ej: Tratamiento facial sesión 1"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Fecha y hora</label>
            <input
              type="datetime-local"
              value={form.session_date}
              onChange={e => set('session_date', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Observaciones sobre la sesión…"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Creando…' : 'Crear sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
