import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import { Tablet, Plus, Trash2, Wifi, WifiOff } from 'lucide-react'
import { api } from '@/lib/api'

interface SigningDevice {
  id: string
  name: string
  created_at: string
  last_seen_at: string | null
  revoked_at: string | null
}

function fmtRelative(iso: string | null, t: (k: string, o?: any) => string) {
  if (!iso) return t('signingDevices.never_seen')
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return t('signingDevices.just_now')
  if (diffMin < 60) return t('signingDevices.minutes_ago', { count: diffMin })
  const diffHours = Math.round(diffMin / 60)
  if (diffHours < 24) return t('signingDevices.hours_ago', { count: diffHours })
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function SigningDevicesPanel() {
  const { t } = useTranslation()
  const [devices, setDevices] = useState<SigningDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [pairing, setPairing] = useState<{ qr: string; expiresAt: string } | null>(null)
  const [deviceName, setDeviceName] = useState('')
  const [creating, setCreating] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/signing-devices')
      setDevices(Array.isArray(data) ? data.filter((d: SigningDevice) => !d.revoked_at) : [])
    } catch {
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!pairing) return
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(pairing.expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) setPairing(null)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [pairing])

  const generatePairing = async () => {
    setCreating(true)
    try {
      const data = await api.post('/signing-devices/pairing-code', { device_name: deviceName || undefined })
      const qr = await QRCode.toDataURL(data.pairUrl, { width: 260, margin: 1, color: { dark: '#0D1B2E', light: '#ffffff' } })
      setPairing({ qr, expiresAt: data.expires_at })
    } finally {
      setCreating(false)
    }
  }

  const revoke = async (id: string) => {
    if (!confirm(t('signingDevices.confirm_revoke'))) return
    await api.delete(`/signing-devices/${id}`)
    load()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Tablet className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-700">{t('signingDevices.title')}</h3>
        </div>
        <p className="text-sm text-slate-500">{t('signingDevices.description')}</p>

        {!pairing ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('signingDevices.device_name')}</label>
              <input
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                placeholder={t('signingDevices.device_name_placeholder')}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={generatePairing}
              disabled={creating}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />{creating ? t('common.loading') : t('signingDevices.generate_qr')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <img src={pairing.qr} alt="QR" className="rounded-xl border border-slate-200" />
            <p className="text-sm text-slate-600">{t('signingDevices.scan_hint')}</p>
            <p className="text-xs text-slate-400">{t('signingDevices.expires_in', { seconds: secondsLeft })}</p>
            <button onClick={() => setPairing(null)} className="text-xs text-slate-400 hover:text-slate-600">{t('common.cancel')}</button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">{t('signingDevices.paired_devices')}</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">{t('common.loading')}</div>
        ) : devices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <Tablet className="w-8 h-8 opacity-20" />
            {t('signingDevices.no_devices')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {devices.map(d => {
              const online = d.last_seen_at && (Date.now() - new Date(d.last_seen_at).getTime()) < 60000
              return (
                <div key={d.id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    {online ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-slate-300" />}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-400">{fmtRelative(d.last_seen_at, t)}</p>
                    </div>
                  </div>
                  <button onClick={() => revoke(d.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
