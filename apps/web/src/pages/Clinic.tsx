import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Building2, Plus, Pencil, Trash2, MapPin, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { Clinic } from '@consentspro/shared-types'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
}

function BranchModal({ branch, onSave, onClose }: {
  branch: Partial<Branch>
  onSave: (b: Partial<Branch>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Branch>>(branch)
  const set = (k: keyof Branch, v: string) => setForm(f => ({ ...f, [k]: v.toUpperCase() }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">{branch.id ? 'Editar sede' : 'Nueva sede'}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <Field label="Nombre de sede" value={form.name ?? ''} onChange={v => set('name', v)} />
        <Field label="Dirección" value={form.address ?? ''} onChange={v => set('address', v)} />
        <Field label="Teléfono" value={form.phone ?? ''} onChange={v => set('phone', v)} type="tel" />
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
          <button
            onClick={() => { onSave(form); onClose() }}
            disabled={!form.name}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            Guardar sede
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export default function ClinicPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<Clinic>>({})
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [branchModal, setBranchModal] = useState<{ open: boolean; branch: Partial<Branch> }>({ open: false, branch: {} })

  useEffect(() => {
    api.get('/clinic').then(data => {
      if (data) {
        setForm(data)
        if (Array.isArray(data.branches)) setBranches(data.branches)
      }
    }).finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: k === 'email' ? v : v.toUpperCase() }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/clinic', { ...form, branches })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const saveBranch = (b: Partial<Branch>) => {
    if (b.id) {
      setBranches(bs => bs.map(x => x.id === b.id ? { ...x, ...b } as Branch : x))
    } else {
      setBranches(bs => [...bs, { ...b, id: crypto.randomUUID() } as Branch])
    }
  }

  const deleteBranch = (id: string) => {
    if (!confirm('¿Eliminar esta sede?')) return
    setBranches(bs => bs.filter(b => b.id !== id))
  }

  if (loading) return <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('clinic.title')}</h1>
          <p className="text-sm text-slate-500">Configuración general de la clínica</p>
        </div>
      </div>

      {/* Main clinic config */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre comercial" value={(form as any).trade_name ?? (form as any).tradeName ?? ''} onChange={v => set('trade_name', v)} />
          <Field label="Nombre fiscal / razón social" value={(form as any).legal_name ?? (form as any).legalName ?? ''} onChange={v => set('legal_name', v)} />
        </div>
        <Field label={t('clinic.name')} value={(form.name as string) ?? ''} onChange={v => set('name', v)} />
        <Field label={t('clinic.address')} value={(form.address as string) ?? ''} onChange={v => set('address', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('clinic.phone')} value={(form.phone as string) ?? ''} onChange={v => set('phone', v)} type="tel" />
          <Field label={t('clinic.email')} value={(form.email as string) ?? ''} onChange={v => set('email', v)} type="email" />
        </div>
        <Field label={t('clinic.tax_id')} value={(form.taxId as string) ?? (form as any).tax_id ?? ''} onChange={v => set('taxId', v)} />

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {saved && <span className="text-sm text-emerald-600 font-medium">✓ Guardado correctamente</span>}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? t('common.loading') : t('clinic.save')}
            </button>
          </div>
        </div>
      </form>

      {/* Multi-sede */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Sedes adicionales</h2>
            <p className="text-xs text-slate-400 mt-0.5">Gestiona múltiples ubicaciones de tu clínica</p>
          </div>
          <button
            onClick={() => setBranchModal({ open: true, branch: {} })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200"
          >
            <Plus className="w-4 h-4" />
            Añadir sede
          </button>
        </div>

        {branches.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Sin sedes adicionales
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {branches.map(b => (
              <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{b.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{b.address}</p>
                  {b.phone && <p className="text-xs text-slate-400">{b.phone}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBranchModal({ open: true, branch: b })}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBranch(b.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {branches.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
            <button
              onClick={handleSubmit as any}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Guardar sedes
            </button>
          </div>
        )}
      </div>

      {branchModal.open && (
        <BranchModal
          branch={branchModal.branch}
          onSave={saveBranch}
          onClose={() => setBranchModal({ open: false, branch: {} })}
        />
      )}
    </div>
  )
}
