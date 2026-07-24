import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LifeBuoy, Plus, X, CheckCircle2, Circle, Building2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface Ticket {
  id: string
  clinic_id: string
  subject: string
  description: string
  status: 'open' | 'resolved'
  created_at: string
  resolved_at: string | null
  notes: string | null
  clinic_name: string
  clinic_trade_name: string | null
  reporter?: { full_name?: string; email?: string } | null
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function NewTicketModal({ onSave, onClose }: { onSave: (subject: string, description: string) => Promise<void>; onClose: () => void }) {
  const { t } = useTranslation()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!subject.trim() || !description.trim()) { setError(t('common.required')); return }
    setSaving(true); setError('')
    try {
      await onSave(subject.trim(), description.trim())
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t('tickets.new_ticket')}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('tickets.subject')}</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={t('tickets.subject_placeholder')}
              className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('tickets.description')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              placeholder={t('tickets.description_placeholder')}
              className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">{t('common.cancel')}</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('tickets.send')}
          </button>
        </div>
      </div>
    </div>
  )
}

function TicketDetailModal({ ticket, isSuperAdmin, onClose, onToggleResolved, onSaveNotes }: {
  ticket: Ticket; isSuperAdmin: boolean; onClose: () => void; onToggleResolved: (t: Ticket) => void; onSaveNotes: (t: Ticket, notes: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState(ticket.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  useEffect(() => { setNotes(ticket.notes ?? '') }, [ticket.id, ticket.notes])

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await onSaveNotes(ticket, notes)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{ticket.subject}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {fmtDate(ticket.created_at)} · {fmtTime(ticket.created_at)}
              {isSuperAdmin && <> · {ticket.clinic_trade_name ?? ticket.clinic_name}</>}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <span className={`w-fit text-xs font-medium px-2.5 py-1 rounded-full ${
            ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {ticket.status === 'resolved' ? t('tickets.status_resolved') : t('tickets.status_open')}
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{t('tickets.description')}</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-xl p-4">{ticket.description}</p>
          </div>
          {ticket.reporter?.full_name && (
            <p className="text-xs text-slate-400">{t('tickets.reported_by')}: {ticket.reporter.full_name}</p>
          )}
          {isSuperAdmin && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{t('tickets.notes')}</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                placeholder={t('tickets.notes_placeholder')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                >
                  {savingNotes ? t('common.saving') : t('tickets.save_notes')}
                </button>
                {notesSaved && <span className="text-xs text-emerald-600 font-medium">✓ {t('common.saved')}</span>}
              </div>
            </div>
          )}
        </div>
        {isSuperAdmin && (
          <div className="p-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onToggleResolved(ticket)}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl transition-colors ${
                ticket.status === 'resolved'
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {ticket.status === 'resolved' ? t('tickets.mark_open') : t('tickets.mark_resolved')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Tickets() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const isSuperAdmin = role === 'superadmin'
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('open')
  const [modalOpen, setModalOpen] = useState(false)
  const [detail, setDetail] = useState<Ticket | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/tickets')
      setTickets(Array.isArray(data) ? data : [])
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (subject: string, description: string) => {
    await api.post('/tickets', { subject, description })
    await load()
  }

  const handleToggleResolved = async (ticket: Ticket) => {
    const nextStatus = ticket.status === 'resolved' ? 'open' : 'resolved'
    const updated = await api.put(`/tickets/${ticket.id}`, { status: nextStatus })
    setTickets(prev => prev.map(x => x.id === ticket.id ? { ...x, ...updated } : x))
    setDetail(d => d && d.id === ticket.id ? { ...d, ...updated } : d)
  }

  const handleSaveNotes = async (ticket: Ticket, notes: string) => {
    const updated = await api.put(`/tickets/${ticket.id}`, { notes })
    setTickets(prev => prev.map(x => x.id === ticket.id ? { ...x, ...updated } : x))
    setDetail(d => d && d.id === ticket.id ? { ...d, ...updated } : d)
  }

  const visibleTickets = tickets.filter(x => statusFilter === 'all' || x.status === statusFilter)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('tickets.title')}</h1>
            <p className="text-sm text-slate-500">{isSuperAdmin ? t('tickets.subtitle_admin') : t('tickets.subtitle_clinic')}</p>
          </div>
        </div>
        {!isSuperAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />{t('tickets.new_ticket')}
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['open', 'resolved', 'all'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t(`tickets.filter_${s}`)}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : visibleTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <LifeBuoy className="w-10 h-10 opacity-20" />
            <p>{t('tickets.no_results')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {visibleTickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setDetail(ticket)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
              >
                {ticket.status === 'resolved'
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{ticket.subject}</p>
                  {isSuperAdmin && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />{ticket.clinic_trade_name ?? ticket.clinic_name}
                    </p>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap text-right">
                  <p>{fmtDate(ticket.created_at)}</p>
                  <p>{fmtTime(ticket.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {modalOpen && <NewTicketModal onSave={handleCreate} onClose={() => setModalOpen(false)} />}
      {detail && (
        <TicketDetailModal
          ticket={detail}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setDetail(null)}
          onToggleResolved={handleToggleResolved}
          onSaveNotes={handleSaveNotes}
        />
      )}
    </div>
  )
}
