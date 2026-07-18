import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Camera, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { PhotoSessionPanel } from '@/components/photos/PhotoSessionPanel'
import { NewSessionModal } from '@/components/photos/NewSessionModal'

export default function PhotoSessions() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [newOpen, setNewOpen]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, p, d] = await Promise.all([
        api.get('/photo-sessions'),
        api.get('/patients'),
        api.get('/doctors'),
      ])
      setSessions(Array.isArray(s) ? s : [])
      setPatients(Array.isArray(p) ? p.map((x: any) => ({
        ...x,
        firstName: x.first_name ?? x.firstName,
        lastName:  x.last_name  ?? x.lastName,
        fullName:  x.full_name  ?? x.fullName ?? [x.first_name, x.last_name].filter(Boolean).join(' '),
      })) : [])
      setDoctors(Array.isArray(d) ? d : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sessions.filter(s =>
      (s.name ?? '').toLowerCase().includes(q) ||
      (s.patient?.full_name ?? '').toLowerCase().includes(q) ||
      (s.patient?.first_name ?? '').toLowerCase().includes(q)
    )
  }, [sessions, search])

  const handleCreate = async (data: { patient_id: string; name: string; notes: string; session_date: string }) => {
    const session = await api.post('/photo-sessions', data)
    setSessions(prev => [session, ...prev])
  }

  const handleUpdate = (updated: any) => {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm(t('photoSessions.confirm_delete'))) return
    await api.delete(`/photo-sessions/${sessionId}`)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Camera className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('photoSessions.title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('photoSessions.subtitle', { count: sessions.length })}</p>
          </div>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('photoSessions.new_session')}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('photoSessions.search_placeholder')}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Camera className="w-10 h-10 mx-auto mb-3 opacity-20" />
          {t('photoSessions.no_sessions')}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(session => {
            const p = session.patient
            const patientName = p ? (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.full_name ?? '—') : '—'
            return (
              <div key={session.id}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 px-1">{patientName}</p>
                <PhotoSessionPanel
                  session={session}
                  onChange={handleUpdate}
                  onDelete={() => handleDelete(session.id)}
                />
              </div>
            )
          })}
        </div>
      )}

      {newOpen && (
        <NewSessionModal
          patients={patients}
          doctors={doctors}
          onSave={handleCreate}
          onClose={() => setNewOpen(false)}
        />
      )}
    </div>
  )
}
