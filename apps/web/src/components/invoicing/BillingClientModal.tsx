import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, X } from 'lucide-react'

interface Props {
  initial?: any
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

export function BillingClientModal({ initial, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [taxId, setTaxId] = useState(initial?.tax_id ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [postalCode, setPostalCode] = useState(initial?.postal_code ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [province, setProvince] = useState(initial?.province ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError('')
    if (!fullName.trim()) { setError(t('billingClientModal.errors.fullName')); return }
    if (!taxId.trim()) { setError(t('billingClientModal.errors.taxId')); return }
    if (!address.trim()) { setError(t('billingClientModal.errors.address')); return }
    setSaving(true)
    try {
      await onSave({
        full_name: fullName.trim(), tax_id: taxId.trim(), address: address.trim(),
        postal_code: postalCode.trim() || null, city: city.trim() || null, province: province.trim() || null,
        email: email.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null,
      })
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('billingClientModal.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {initial ? t('billingClientModal.titleEdit') : t('billingClientModal.titleNew')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('billingClientModal.fields.fullName')} <span className="text-red-500">*</span></label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('billingClientModal.fields.taxId')} <span className="text-red-500">*</span></label>
              <input value={taxId} onChange={e => setTaxId(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('billingClientModal.fields.phone')}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('billingClientModal.fields.address')} <span className="text-red-500">*</span></label>
            <input value={address} onChange={e => setAddress(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('billingClientModal.fields.postalCode')}</label>
              <input value={postalCode} onChange={e => setPostalCode(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('billingClientModal.fields.city')}</label>
              <input value={city} onChange={e => setCity(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('billingClientModal.fields.province')}</label>
              <input value={province} onChange={e => setProvince(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('billingClientModal.fields.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <p className="text-[11px] text-slate-400">{t('billingClientModal.fields.emailHint')}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('billingClientModal.fields.notes')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
