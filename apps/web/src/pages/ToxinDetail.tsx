import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Syringe, FileText, PenLine } from 'lucide-react'
import { api } from '@/lib/api'
import { ConsentPdfButton } from '@/components/consents/ConsentPdfButton'

export default function ToxinDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<any>(null)
  const [consent, setConsent] = useState<any>(null)
  const [clinic, setClinic] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/toxin/${id}`)
      .then(setRecord)
      .catch(() => setRecord(null))
      .finally(() => setLoading(false))
    api.get('/clinic').then(setClinic).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!record?.consent_id) { setConsent(null); return }
    api.get(`/consents/${record.consent_id}`).then(setConsent).catch(() => setConsent(null))
  }, [record?.consent_id])

  const patientName = (p: any) => p ? (p.full_name ?? p.fullName ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) : '—'
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
  const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  if (loading) return <div className="p-12 text-center text-slate-400">Cargando…</div>
  if (!record) return <div className="p-12 text-center text-slate-400">Registro no encontrado.</div>

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/toxina')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Syringe className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{record.brand_name} — {patientName(record.patient)}</h1>
          <p className="text-sm text-slate-500">{fmtDateTime(record.application_date)}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Paciente</p><p className="text-slate-800">{patientName(record.patient)}</p></div>
        <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Doctor</p><p className="text-slate-800">{record.doctor?.name ?? '—'}</p></div>
        <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Nombre comercial</p><p className="text-slate-800">{record.brand_name}</p></div>
        <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Fabricante</p><p className="text-slate-800">{record.manufacturer}</p></div>
        <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Número de lote</p><p className="text-slate-800">{record.lot_number}</p></div>
        <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Fecha de caducidad</p><p className="text-slate-800">{fmtDate(record.expiry_date)}</p></div>
        <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Viales abiertos</p><p className="text-slate-800">{record.vials_opened ?? 1}</p></div>
        <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total de unidades</p><p className="text-blue-700 font-bold">{record.total_units} U</p></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Zonas tratadas</p>
        <div className="flex flex-col gap-1.5">
          {(record.treated_zones ?? []).map((z: any, i: number) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
              <span className="text-slate-700">{z.zone}</span>
              <span className="font-semibold text-slate-600">{z.units} U</span>
            </div>
          ))}
          {(record.treated_zones ?? []).length === 0 && <p className="text-sm text-slate-400">Sin zonas registradas.</p>}
        </div>
        {record.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notas</p>
            <p className="text-sm text-slate-600">{record.notes}</p>
          </div>
        )}
      </div>

      {/* Firma del médico */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <PenLine className="w-4 h-4 text-slate-500" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Firma del médico</p>
        </div>
        {record.doctor_signature ? (
          <div className="flex flex-col gap-2">
            <div className="border border-slate-200 rounded-lg p-3 bg-white w-fit">
              <img src={record.doctor_signature} alt="Firma del médico" className="h-24 object-contain" />
            </div>
            <p className="text-xs text-slate-400">Firmado el {fmtDateTime(record.doctor_signed_at)}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Este registro no tiene firma del médico.</p>
        )}
      </div>

      {/* Consentimiento informado vinculado */}
      {record.consent_id && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Consentimiento informado vinculado</p>
          </div>
          {record.consent ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{record.consent.treatment_type ?? 'Consentimiento'}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {record.consent.signed_at ? `Firmado el ${fmtDateTime(record.consent.signed_at)}` : 'Sin firmar'}
                </p>
              </div>
              {consent ? (
                <ConsentPdfButton consent={consent} clinic={clinic} />
              ) : (
                <span className="text-xs text-slate-400">Cargando PDF…</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No se pudo cargar la información del consentimiento vinculado.</p>
          )}
        </div>
      )}
    </div>
  )
}
