import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, X, Plus, Trash2 } from 'lucide-react'

const MANUAL = '__manual__'

interface BudgetItem { treatment_id: string | null; treatment_name: string; price: number }

interface Props {
  initial?: {
    id?: string
    patient_id?: string
    items?: BudgetItem[]
    notes?: string
    valid_until?: string
  }
  patients: any[]
  treatments: any[]
  onSave: (data: any) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

const patientLabel = (p: any) => p.full_name ?? p.fullName ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()

function emptyItem(): BudgetItem {
  return { treatment_id: null, treatment_name: '', price: 0 }
}

function toDateInputValue(iso?: string) {
  if (!iso) return ''
  return String(iso).slice(0, 10)
}

export function BudgetModal({ initial, patients, treatments, onSave, onDelete, onClose }: Props) {
  const { t } = useTranslation()
  const isEdit = !!initial?.id
  const [patientId, setPatientId] = useState(initial?.patient_id ?? '')
  const [items, setItems] = useState<BudgetItem[]>(initial?.items?.length ? initial.items : [emptyItem()])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [validUntil, setValidUntil] = useState(toDateInputValue(initial?.valid_until))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0)

  const updateItem = (i: number, patch: Partial<BudgetItem>) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  }

  const handleTreatmentSelect = (i: number, value: string) => {
    if (value === MANUAL || value === '') {
      updateItem(i, { treatment_id: null, treatment_name: value === MANUAL ? '' : items[i].treatment_name })
      return
    }
    const tr = treatments.find(t => t.id === value)
    if (tr) updateItem(i, { treatment_id: tr.id, treatment_name: tr.name, price: Number(tr.price) || 0 })
  }

  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (i: number) => setItems(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)

  const handleSave = async () => {
    setError('')
    const cleanItems = items
      .map(it => ({ ...it, treatment_name: it.treatment_name.trim() }))
      .filter(it => it.treatment_name)
    if (cleanItems.length === 0) {
      setError(t('budgetModal.errors.no_items'))
      return
    }
    setSaving(true)
    try {
      await onSave({ patient_id: patientId || null, items: cleanItems, notes: notes || null, valid_until: validUntil || null })
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('budgetModal.errors.save_failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? t('budgetModal.title_edit') : t('budgetModal.title_new')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('budgetModal.form.patient')}</label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('budgetModal.form.select_patient')}</option>
              {patients.map(p => <option key={p.id} value={p.id}>{patientLabel(p)}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('budgetModal.form.treatments')}</label>
            {items.map((it, i) => (
              <div key={i} className="flex flex-col gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <select
                    value={it.treatment_id ?? (it.treatment_name ? MANUAL : '')}
                    onChange={e => handleTreatmentSelect(i, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('budgetModal.form.select_treatment')}</option>
                    {treatments.map(tr => (
                      <option key={tr.id} value={tr.id}>{tr.name} — {Number(tr.price).toFixed(2)} €</option>
                    ))}
                    <option value={MANUAL}>{t('budgetModal.form.manual_treatment')}</option>
                  </select>
                  <button
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={it.treatment_name}
                    onChange={e => updateItem(i, { treatment_name: e.target.value })}
                    placeholder={t('budgetModal.form.treatment_name_placeholder')}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="relative w-32">
                    <input
                      type="number"
                      step="0.01"
                      value={it.price}
                      onChange={e => updateItem(i, { price: Number(e.target.value) })}
                      className="w-full px-3 py-2 pr-7 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addItem}
              className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-blue-200"
            >
              <Plus className="w-4 h-4" />{t('budgetModal.form.add_treatment')}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-white uppercase tracking-wide">{t('budgetModal.form.total')}</span>
            <span className="text-lg font-bold text-amber-400">{total.toFixed(2)} €</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('budgetModal.form.valid_until')}</label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('budgetModal.form.notes')}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          {onDelete ? (
            <button
              onClick={() => { if (confirm(t('budgetModal.confirm_delete'))) onDelete() }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
            >
              {t('common.delete')}
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
