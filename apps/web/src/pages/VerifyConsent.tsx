import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Shield, FileText, User, Stethoscope, Hash } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL

interface ConsentVerification {
  id: string
  consent_uuid: string
  status: 'signed' | 'pending' | 'revoked' | 'expired'
  document_hash: string
  signed_at: string | null
  server_timestamp: string | null
  patient: { full_name: string } | null
  doctor: { name: string } | null
  template: { treatment_type: string } | null
}

export default function VerifyConsent() {
  const [data, setData] = useState<ConsentVerification | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const id = window.location.pathname.split('/').pop()

  useEffect(() => {
    if (!id) { setError('ID no proporcionado'); setLoading(false); return }
    fetch(`${BASE_URL}/verify/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Verificando documento…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A2B4A] px-6 py-5 flex items-center gap-3">
          <Shield className="w-6 h-6 text-white" />
          <div>
            <h1 className="text-white font-bold text-lg">ConsentsPro</h1>
            <p className="text-slate-300 text-xs">Verificación de documento</p>
          </div>
        </div>

        {/* Status banner */}
        {error ? (
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Documento no encontrado</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
          </div>
        ) : data?.status === 'signed' ? (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-700">Documento válido y firmado</p>
              <p className="text-xs text-emerald-600 mt-0.5">La firma ha sido verificada correctamente</p>
            </div>
          </div>
        ) : data?.status === 'revoked' ? (
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Consentimiento revocado</p>
              <p className="text-xs text-red-500 mt-0.5">El paciente revocó este consentimiento</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-700">Pendiente de firma</p>
              <p className="text-xs text-amber-600 mt-0.5">Este documento aún no ha sido firmado</p>
            </div>
          </div>
        )}

        {/* Document details */}
        {data && (
          <div className="px-6 py-5 flex flex-col gap-4">
            <Row icon={<User className="w-4 h-4 text-slate-400" />} label="Paciente" value={data.patient?.full_name ?? '—'} />
            <Row icon={<Stethoscope className="w-4 h-4 text-slate-400" />} label="Médico" value={data.doctor?.name ?? '—'} />
            <Row icon={<FileText className="w-4 h-4 text-slate-400" />} label="Tratamiento" value={data.template?.treatment_type ?? '—'} />
            {data.signed_at && (
              <Row
                icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
                label="Fecha de firma"
                value={new Date(data.signed_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
              />
            )}
            {data.document_hash && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hash SHA-256</span>
                </div>
                <p className="font-mono text-[10px] text-slate-400 break-all bg-slate-50 rounded-lg p-3 leading-relaxed">
                  {data.document_hash}
                </p>
              </div>
            )}
            <div className="mt-2 pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                ID de documento: <span className="font-mono">{data.consent_uuid}</span><br />
                Verificado en {new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}.
                Este documento es válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  )
}
