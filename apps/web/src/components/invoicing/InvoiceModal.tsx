import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeEuro, X } from 'lucide-react'
import { PatientCombobox } from '@/components/patients/PatientCombobox'
import { PatientForm } from '@/components/patients/PatientForm'
import { BillingClientCombobox } from './BillingClientCombobox'
import { BillingClientModal } from './BillingClientModal'
import { api } from '@/lib/api'

const VAT_RATES = [21, 10, 4, 0]

interface Props {
  patients: any[]
  billingClients?: any[]
  onBillingClientCreated?: (client: any) => void
  onPatientCreated?: (patient: any) => void
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

const patientLabel = (p: any) => p.full_name ?? p.fullName ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()

export function InvoiceModal({ patients, billingClients = [], onBillingClientCreated = () => {}, onPatientCreated, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [recipientMode, setRecipientMode] = useState<'paciente' | 'cliente'>('paciente')
  const [patientId, setPatientId] = useState('')
  const [billingClientId, setBillingClientId] = useState('')
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [showNewPatientModal, setShowNewPatientModal] = useState(false)
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

  const switchMode = (mode: 'paciente' | 'cliente') => {
    setRecipientMode(mode)
    setPatientId('')
    setBillingClientId('')
    setRecipientName('')
    setRecipientNif('')
    setRecipientAddress('')
  }

  const handlePatientSelect = (value: string) => {
    setPatientId(value)
    if (!value) { setRecipientName(''); setRecipientNif(''); setRecipientAddress(''); return }
    const p = patients.find(pt => pt.id === value)
    if (p) {
      setRecipientName(patientLabel(p))
      setRecipientNif(p.id_document ?? '')
      setRecipientAddress((p.address ?? '').split('|')[0] ?? '')
    }
  }

  const handleClientSelect = (value: string) => {
    setBillingClientId(value)
    const c = billingClients.find(bc => bc.id === value)
    if (c) {
      setRecipientName(c.full_name)
      setRecipientNif(c.tax_id)
      setRecipientAddress(c.address ?? '')
    } else {
      setRecipientName(''); setRecipientNif(''); setRecipientAddress('')
    }
  }

  const handleCreatePatient = async (data: any) => {
    const created = await api.post('/patients', data)
    onPatientCreated?.(created)
    // No usar handlePatientSelect aquí: busca en la prop patients, que todavía
    // no incluye a "created" porque el setPatients del padre (onPatientCreated)
    // es asíncrono — mismo motivo que handleCreateClient más abajo.
    setPatientId(created.id)
    setRecipientName(patientLabel(created))
    setRecipientNif(created.id_document ?? created.idDocument ?? '')
    setRecipientAddress((created.address ?? '').split('|')[0] ?? '')
  }

  const handleCreateClient = async (data: any) => {
    const created = await api.post('/billing-clients', data)
    onBillingClientCreated(created)
    // No usar handleClientSelect aquí: busca en la prop billingClients, que
    // todavía no incluye a "created" porque el setBillingClients del padre
    // (onBillingClientCreated) es asíncrono — se rellenaba con el cliente
    // recién creado en blanco. Usamos directamente los datos ya conocidos.
    setBillingClientId(created.id)
    setRecipientName(created.full_name)
    setRecipientNif(created.tax_id)
    setRecipientAddress(created.address ?? '')
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
        patient_id: recipientMode === 'paciente' ? (patientId || null) : null,
        billing_client_id: recipientMode === 'cliente' ? (billingClientId || null) : null,
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

  const clientLocked = recipientMode === 'cliente' && !!billingClientId

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
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.whoAreYouBilling')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => switchMode('paciente')}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${recipientMode === 'paciente' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t('invoiceModal.form.billToPatient')}
              </button>
              <button
                type="button"
                onClick={() => switchMode('cliente')}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${recipientMode === 'cliente' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t('invoiceModal.form.billToClient')}
              </button>
            </div>
          </div>

          {recipientMode === 'paciente' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.patient')}</label>
              <PatientCombobox
                patients={patients}
                value={patientId}
                onChange={handlePatientSelect}
                onCreateNew={() => setShowNewPatientModal(true)}
                placeholder={t('invoiceModal.form.selectPatientOrManual')}
              />
              <p className="text-[11px] text-slate-400">{t('invoiceModal.form.manualHint')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.client')}</label>
              <BillingClientCombobox
                clients={billingClients}
                value={billingClientId}
                onChange={handleClientSelect}
                onCreateNew={() => setShowNewClientModal(true)}
                placeholder={t('invoiceModal.form.selectClient')}
              />
            </div>
          )}

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
                disabled={clientLocked}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.recipientNif')}</label>
              <input
                value={recipientNif}
                onChange={e => setRecipientNif(e.target.value)}
                disabled={clientLocked}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceModal.form.recipientAddress')}</label>
            <input
              value={recipientAddress}
              onChange={e => setRecipientAddress(e.target.value)}
              disabled={clientLocked}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
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

      {showNewClientModal && (
        <BillingClientModal
          onSave={handleCreateClient}
          onClose={() => setShowNewClientModal(false)}
        />
      )}

      {showNewPatientModal && (
        <PatientForm
          onSave={handleCreatePatient}
          onClose={() => setShowNewPatientModal(false)}
        />
      )}
    </div>
  )
}
