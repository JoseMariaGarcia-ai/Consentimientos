import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeEuro, X } from 'lucide-react'
import { PatientCombobox } from '@/components/patients/PatientCombobox'

const MANUAL = '__manual__'
const VAT_RATES = [21, 10, 4, 0]

interface Props {
  patients: any[]
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

const patientLabel = (p: any) => p.full_name ?? p.fullName ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()

export function InvoiceModal({ patients, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [patientId, setPatientId] = useState('')
  const [taxpayerType, setTaxpayerType] = useState<'empresa' | 'autonomo'>('autonomo')
  const [recipientName, setRecipientName] = useState('')
  const [recipientNif, setRecipientNif] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [concept, setConcept] = useState('')
  const [baseAmount, setBaseAmount] = useState('')
  const [vatRate, setVatRate] = useState(21)
  const [series, setSeries] = useState('A')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const base = Number(baseAmount) || 0
  const vatAmount = Math.round(base * vatRate) / 100
  const total = Math.round((base + vatAmount) * 100) / 100

  const handlePatientSelect = (value: string) => {
    setPatientId(value)
    if (value === MANUAL || value === '') { setPatientId(''); return }
    const p = patients.find(pt => pt.id === value)
    if (p) {
      setRecipientName(patientLabel(p))
      setRecipientNif(p.id_document ?? '')
      setRecipientAddress((p.address ?? '').split('|')[0] ?? '')
    }
  }

  const handleSave = async () => {
    setError('')
    if (!recipientName.trim()) { setError(t('invoiceModal.errors.recipientName')); return }
    if (!recipientNif.trim()) { setError(t('invoiceModal.errors.recipientNif')); return }
    if (!concept.trim()) { setError(t('invoiceModal.errors.concept')); return }
    if (!(base > 0)) { setError(t('invoiceModal.errors.baseAmount')); return }
    setSaving(true)
    try {
      await onSave({
        patient_id: patientId || null,
        taxpayer_type: taxpayerType,
        recipient_name: recipientName.trim(),
        recipient_nif: recipientNif.trim(),
        recipient_address: recipientAddress.trim() || null,
        concept: concept.trim(),
        base_amount: base,
        vat_rate: vatRate,
        series: series.trim() || 'A',
      })
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('invoiceModal.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <BadgeEuro className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">{t('invoiceModal.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.patient')}</label>
            <PatientCombobox
              patients={patients}
              value={patientId}
              onChange={handlePatientSelect}
              placeholder={t('invoiceModal.form.selectPatientOrManual')}
            />
            <p className="text-[11px] text-slate-400">{t('invoiceModal.form.manualHint')}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.taxpayerType')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTaxpayerType('autonomo')}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${taxpayerType === 'autonomo' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t('invoiceModal.form.autonomo')}
              </button>
              <button
                type="button"
                onClick={() => setTaxpayerType('empresa')}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${taxpayerType === 'empresa' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t('invoiceModal.form.empresa')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.recipientName')}</label>
              <input
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.recipientNif')}</label>
              <input
                value={recipientNif}
                onChange={e => setRecipientNif(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.recipientAddress')}</label>
            <input
              value={recipientAddress}
              onChange={e => setRecipientAddress(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.concept')}</label>
            <textarea
              value={concept}
              onChange={e => setConcept(e.target.value)}
              rows={2}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.baseAmount')}</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={baseAmount}
                  onChange={e => setBaseAmount(e.target.value)}
                  className="w-full px-3 py-2 pr-7 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.vatRate')}</label>
              <select
                value={vatRate}
                onChange={e => setVatRate(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {VAT_RATES.map(r => (
                  <option key={r} value={r}>{r === 0 ? t('invoiceModal.form.vatExempt') : `${r}%`}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.series')}</label>
              <input
                value={series}
                onChange={e => setSeries(e.target.value.toUpperCase().slice(0, 10))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{t('invoiceModal.form.base')}</span>
              <span>{base.toFixed(2)} €</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{t('invoiceModal.form.vat', { rate: vatRate })}</span>
              <span>{vatAmount.toFixed(2)} €</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-800 uppercase tracking-wide">{t('invoiceModal.form.total')}</span>
              <span className="text-lg font-bold text-emerald-700">{total.toFixed(2)} €</span>
            </div>
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
            {saving ? t('common.saving') : t('invoiceModal.form.issue')}
          </button>
        </div>
      </div>
    </div>
  )
}
