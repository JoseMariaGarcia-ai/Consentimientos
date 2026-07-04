import { useState, useEffect } from 'react'
import { Syringe, X, Plus, Trash2, PenLine } from 'lucide-react'
import { BOTOX_ZONES } from '@/constants/botoxZones'
import { SignatureCanvas } from '@/components/signature/SignatureCanvas'
import { api } from '@/lib/api'

interface ZoneEntry { zone: string; units: number }

interface Props {
  initial?: {
    id?: string
    patient_id?: string
    doctor_id?: string
    application_date?: string
    brand_name?: string
    lot_number?: string
    expiry_date?: string
    manufacturer?: string
    treated_zones?: ZoneEntry[]
    vials_opened?: number
    consent_id?: string
    doctor_signature?: string
    doctor_signed_at?: string
    notes?: string
  }
  patients: any[]
  doctors: any[]
  onSave: (data: any) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

function toLocalInputValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function toDateInputValue(iso?: string) {
  if (!iso) return ''
  return String(iso).slice(0, 10)
}

const patientLabel = (p: any) => p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : (p.fullName ?? p.full_name ?? '')

export function ToxinModal({ initial, patients, doctors, onSave, onDelete, onClose }: Props) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    patient_id: initial?.patient_id ?? '',
    doctor_id: initial?.doctor_id ?? '',
    application_date: toLocalInputValue(initial?.application_date),
    brand_name: initial?.brand_name ?? '',
    lot_number: initial?.lot_number ?? '',
    expiry_date: toDateInputValue(initial?.expiry_date),
    manufacturer: initial?.manufacturer ?? '',
    vials_opened: initial?.vials_opened ?? 1,
    consent_id: initial?.consent_id ?? '',
    notes: initial?.notes ?? '',
  })
  const [zones, setZones] = useState<ZoneEntry[]>(initial?.treated_zones ?? [])
  const [customZoneName, setCustomZoneName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [patientConsents, setPatientConsents] = useState<any[]>([])
  const [loadingConsents, setLoadingConsents] = useState(false)

  const [existingSignature] = useState(initial?.doctor_signature ?? '')
  const [existingSignedAt] = useState(initial?.doctor_signed_at ?? '')
  const [newSignature, setNewSignature] = useState('')
  const [resigning, setResigning] = useState(!isEdit) // new records always need a fresh signature

  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  // Consents can only be linked to the toxin/botulinum templates, for the selected patient.
  useEffect(() => {
    if (!form.patient_id) { setPatientConsents([]); return }
    setLoadingConsents(true)
    api.get(`/consents?patient_id=${form.patient_id}&type=toxina&status=signed`)
      .then((data: any) => setPatientConsents(Array.isArray(data) ? data : []))
      .catch(() => setPatientConsents([]))
      .finally(() => setLoadingConsents(false))
  }, [form.patient_id])

  const isZoneActive = (zone: string) => zones.some(z => z.zone === zone)
  const toggleZone = (zone: string) => {
    setZones(zs => isZoneActive(zone) ? zs.filter(z => z.zone !== zone) : [...zs, { zone, units: 0 }])
  }
  const setZoneUnits = (zone: string, units: number) => {
    setZones(zs => zs.map(z => z.zone === zone ? { ...z, units } : z))
  }
  const removeZone = (zone: string) => setZones(zs => zs.filter(z => z.zone !== zone))
  const addCustomZone = () => {
    if (!customZoneName.trim()) return
    setZones(zs => [...zs, { zone: customZoneName.trim(), units: 0 }])
    setCustomZoneName('')
  }

  const totalUnits = zones.reduce((sum, z) => sum + (Number(z.units) || 0), 0)
  const effectiveSignature = resigning ? newSignature : existingSignature

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patient_id || !form.brand_name || !form.lot_number || !form.expiry_date || !form.manufacturer) {
      setError('Paciente, nombre comercial, lote, caducidad y fabricante son obligatorios')
      return
    }
    if (!effectiveSignature) {
      setError('La firma del médico es obligatoria para guardar el registro')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        ...form,
        doctor_id: form.doctor_id || undefined,
        consent_id: form.consent_id || undefined,
        application_date: new Date(form.application_date).toISOString(),
        treated_zones: zones,
        vials_opened: Number(form.vials_opened) || 1,
        doctor_signature: effectiveSignature,
      })
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm('¿Eliminar este registro de toxina?')) return
    setDeleting(true)
    try {
      await onDelete()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Syringe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">{isEdit ? 'Editar registro de toxina' : 'Nuevo registro de toxina'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Paciente <span className="text-red-500">*</span></label>
              <select value={form.patient_id} onChange={e => set('patient_id', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar paciente…</option>
                {patients.map(p => <option key={p.id} value={p.id}>{patientLabel(p)}</option>)}
              </select>
            </div>

            {/* Consentimiento vinculado — solo aparece tras elegir paciente */}
            {form.patient_id && (
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Consentimiento informado vinculado</label>
                <select value={form.consent_id} onChange={e => set('consent_id', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sin vincular</option>
                  {patientConsents.map(c => {
                    const treatment = c.template?.treatment_type ?? c.template?.treatmentType ?? 'Consentimiento'
                    const signedAt = c.signed_at ?? c.signedAt
                    const dateLabel = signedAt ? new Date(signedAt).toLocaleDateString('es-ES') : 'sin firmar'
                    return <option key={c.id} value={c.id}>{treatment} — {dateLabel}</option>
                  })}
                </select>
                {loadingConsents && <p className="text-xs text-slate-400">Cargando consentimientos…</p>}
                {!loadingConsents && patientConsents.length === 0 && (
                  <p className="text-xs text-slate-400">Este paciente no tiene consentimientos de toxina firmados todavía. Es opcional, puedes guardar el registro sin vincularlo.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Doctor</label>
              <select value={form.doctor_id} onChange={e => set('doctor_id', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin asignar</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Fecha de aplicación <span className="text-red-500">*</span></label>
              <input type="datetime-local" step={900} value={form.application_date} onChange={e => set('application_date', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Nombre comercial <span className="text-red-500">*</span></label>
              <input value={form.brand_name} onChange={e => set('brand_name', e.target.value)} placeholder="Botox, Dysport, Xeomin…"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Fabricante <span className="text-red-500">*</span></label>
              <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="Allergan, Ipsen, Merz…"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Número de lote <span className="text-red-500">*</span></label>
              <input value={form.lot_number} onChange={e => set('lot_number', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Fecha de caducidad <span className="text-red-500">*</span></label>
              <input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Viales abiertos <span className="text-red-500">*</span></label>
              <input type="number" min={1} value={form.vials_opened} onChange={e => set('vials_opened', Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Zonas tratadas */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Zonas tratadas</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {BOTOX_ZONES.filter(z => z !== 'Otra zona').map(zone => (
                <label key={zone} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={isZoneActive(zone)} onChange={() => toggleZone(zone)} className="accent-blue-600 flex-shrink-0" />
                  {zone}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input value={customZoneName} onChange={e => setCustomZoneName(e.target.value)} placeholder="Otra zona…"
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={addCustomZone} className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
                <Plus className="w-3.5 h-3.5" />Añadir
              </button>
            </div>

            {zones.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {zones.map(z => (
                  <div key={z.zone} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-slate-700 flex-1">{z.zone}</span>
                    <input
                      type="number" min={0} value={z.units}
                      onChange={e => setZoneUnits(z.zone, Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-400">U</span>
                    <button type="button" onClick={() => removeZone(z.zone)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total de unidades</span>
              <span className="text-sm font-bold text-blue-700">{totalUnits} U</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Notas</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Observaciones…"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Firma del médico — obligatoria para guardar */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Firma del médico <span className="text-red-500">*</span></label>
            {!resigning && existingSignature ? (
              <div className="flex flex-col gap-2">
                <div className="border border-slate-200 rounded-lg p-2 bg-white">
                  <img src={existingSignature} alt="Firma del médico" className="h-20 object-contain" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Firmado {existingSignedAt ? new Date(existingSignedAt).toLocaleString('es-ES') : ''}
                  </p>
                  <button type="button" onClick={() => setResigning(true)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                    <PenLine className="w-3.5 h-3.5" />Firmar de nuevo
                  </button>
                </div>
              </div>
            ) : (
              <SignatureCanvas onSave={dataUrl => setNewSignature(dataUrl)} onClear={() => setNewSignature('')} />
            )}
            {resigning && !newSignature && (
              <p className="text-xs text-amber-600">Dibuje la firma y pulse "Confirmar firma" antes de guardar.</p>
            )}
          </div>

          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {error}</div>}

          <div className="flex justify-between items-center gap-3 pt-2 border-t border-slate-100">
            {isEdit && onDelete ? (
              <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                {deleting ? 'Eliminando…' : 'Eliminar registro'}
              </button>
            ) : <span />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear registro'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
