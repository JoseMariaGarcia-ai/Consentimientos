import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Search, AlertTriangle, Building2, ShieldCheck, Check, CheckCheck, Clock, Link2, Copy, RefreshCcw, ChevronDown, Flag } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useWhatsAppUnread } from '@/hooks/useWhatsAppUnread'

// Mismo valor que ADMIN_SCOPE en el backend (routes/whatsapp.ts) — el
// superadmin lo usa para escribir como ConsentsPro a cualquier clínica o
// persona, sin que la conversación pertenezca a ninguna clínica concreta.
const ADMIN_SCOPE = '__admin__'

interface Conversation {
  id: string
  phone: string
  contact_name: string | null
  last_message_at: string
  last_message_preview: string | null
  unread_count: number
  is_pending: boolean
  source?: 'link_directo' | 'mensaje_saliente_clinica' | 'pregunta_ambigua' | 'recencia_automatica' | null
}

type ConversationTab = 'all' | 'unread' | 'pending'

interface ClinicOption { id: string; name: string; trade_name: string | null; phone: string | null; unread: number }

// Selector propio (no <select> nativo) porque un <select> no puede pintar
// globos de colores dentro de las opciones — el superadmin necesita ver de
// un vistazo en cuál de sus clínicas hay mensajes sin leer antes de entrar.
function ClinicPicker({
  value, onChange, clinics, adminUnread,
}: { value: string; onChange: (id: string) => void; clinics: ClinicOption[]; adminUnread: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedClinic = clinics.find(c => c.id === value)
  const label = value === ADMIN_SCOPE
    ? '⚡ ConsentsPro (administrador)'
    : selectedClinic
    ? (selectedClinic.trade_name ?? selectedClinic.name)
    : '— Seleccionar clínica —'

  const Badge = ({ count, color }: { count: number; color: string }) =>
    count > 0 ? (
      <span className={`min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full text-white text-[10px] font-bold flex-shrink-0 ${color}`}>
        {count}
      </span>
    ) : null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-xs"
      >
        {value === ADMIN_SCOPE ? <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />}
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] overflow-hidden max-h-96 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(ADMIN_SCOPE); setOpen(false) }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-slate-50 ${value === ADMIN_SCOPE ? 'bg-emerald-50' : ''}`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="flex-1 truncate">⚡ ConsentsPro (administrador)</span>
            <Badge count={adminUnread} color="bg-violet-500" />
          </button>
          <div className="border-t border-slate-100" />
          {clinics.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange(c.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-slate-50 ${value === c.id ? 'bg-emerald-50' : ''}`}
            >
              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="flex-1 min-w-0 truncate">{c.trade_name ?? c.name}</span>
              <Badge count={c.unread} color="bg-emerald-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Enlace directo de la clínica al número único de WhatsApp compartido — lo
// muestra la propia clínica para copiarlo y publicarlo donde quiera, evita
// la ambigüedad de a qué clínica pertenece un mensaje entrante nuevo.
function DirectLinkPanel({ clinicId }: { clinicId: string }) {
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLink(null)
    api.get(`/whatsapp/direct-link?clinicId=${clinicId}`).then((d: any) => setLink(d.link)).catch(() => setLink(null))
  }, [clinicId])

  if (!link) return null

  return (
    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
      <Link2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <p className="text-xs text-emerald-800 flex-1 truncate">{link}</p>
      <button
        onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="flex-shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
      >
        <Copy className="w-3 h-3" /> {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  body: string | null
  status: string
  created_at: string
}

export default function WhatsApp() {
  const { role } = useAuth()
  const isSuperAdmin = role === 'superadmin'
  const { adminUnread } = useWhatsAppUnread()

  const [clinics, setClinics]           = useState<ClinicOption[]>([])
  const [clinicId, setClinicId]         = useState<string>('')
  const [configured, setConfigured]     = useState<boolean | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected]         = useState<Conversation | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [search, setSearch]             = useState('')
  const [draft, setDraft]               = useState('')
  const [sending, setSending]           = useState(false)
  const [error, setError]               = useState('')
  const [notice, setNotice]             = useState('')
  const [newPhone, setNewPhone]         = useState('')
  const [showNewChat, setShowNewChat]   = useState(false)
  const [tab, setTab]                   = useState<ConversationTab>('all')
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMessageCount = useRef(0)

  // Load clinics available to this user — el superadmin entra siempre
  // primero en modo administrador (ConsentsPro), no en la clínica de turno,
  // pero necesita igualmente la lista de clínicas para poder cambiar luego.
  useEffect(() => {
    if (isSuperAdmin) setClinicId(ADMIN_SCOPE)
    api.get('/whatsapp/clinics').then((data: any) => {
      const list = Array.isArray(data) ? data : []
      setClinics(list)
      if (!isSuperAdmin && list.length === 1) setClinicId(list[0].id)
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check YCloud configuration + load conversations whenever clinic changes
  useEffect(() => {
    if (!clinicId) return
    setConfigured(null)
    api.get(`/whatsapp/status?clinicId=${clinicId}`).then((d: any) => setConfigured(!!d.configured)).catch(() => setConfigured(false))
    loadConversations()
    setSelected(null)
    setMessages([])
  }, [clinicId])

  // El panel no tenía ninguna actualización en vivo — un mensaje entrante
  // solo aparecía si se recargaba la página entera. Se sondea la lista de
  // conversaciones cada 8s (para ver mensajes/no leídos nuevos sin tener
  // abierta esa conversación) y, si hay una abierta, sus mensajes cada 4s.
  useEffect(() => {
    if (!clinicId) return
    const id = setInterval(loadConversations, 8000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId])

  useEffect(() => {
    if (!selected) return
    const id = setInterval(() => loadMessages(selected.id, { silent: true }), 4000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id])

  const loadConversations = () => {
    if (!clinicId) return
    api.get(`/whatsapp/conversations?clinicId=${clinicId}`).then((data: any) => {
      setConversations(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }

  const loadMessages = (conversationId: string, opts?: { silent?: boolean }) => {
    api.get(`/whatsapp/conversations/${conversationId}/messages?clinicId=${clinicId}`).then((data: any) => {
      setMessages(Array.isArray(data) ? data : [])
    }).catch(() => { if (!opts?.silent) setMessages([]) })
  }

  const openConversation = (c: Conversation) => {
    setSelected(c)
    lastMessageCount.current = 0
    setError(''); setNotice('')
    loadMessages(c.id)
  }

  // Con el sondeo cada 4s, "messages" cambia de referencia aunque el
  // contenido sea el mismo — desplazar solo cuando de verdad hay mensajes
  // nuevos, para no interrumpir a quien esté leyendo mensajes antiguos.
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    lastMessageCount.current = messages.length
  }, [messages])

  const handleSend = async () => {
    const phone = selected?.phone ?? newPhone.trim()
    if (!phone || !draft.trim()) return
    setSending(true); setError(''); setNotice('')
    try {
      const msg = await api.post('/whatsapp/send', {
        targetClinicId: clinicId,
        phone,
        body: draft.trim(),
      })
      setMessages(m => [...m, msg])
      setDraft('')
      if (msg?.viaTemplate) {
        setNotice('Han pasado más de 24h desde el último mensaje de este contacto: WhatsApp no permite texto libre fuera de esa ventana, así que se ha enviado la plantilla de contacto aprobada en su lugar. La conversación se reabrirá en cuanto responda.')
      }
      loadConversations()
      if (!selected) {
        setShowNewChat(false)
        setNewPhone('')
        loadConversations()
      }
    } catch (e: any) {
      setError(e.message ?? 'Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const togglePending = async (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextPending = !c.is_pending
    setConversations(cs => cs.map(x => x.id === c.id ? { ...x, is_pending: nextPending } : x))
    setSelected(s => s?.id === c.id ? { ...s, is_pending: nextPending } : s)
    try {
      await api.post(`/whatsapp/conversations/${c.id}/pending`, { clinicId, pending: nextPending })
    } catch {
      // Si falla el guardado, se revierte el marcador optimista.
      setConversations(cs => cs.map(x => x.id === c.id ? { ...x, is_pending: c.is_pending } : x))
      setSelected(s => s?.id === c.id ? { ...s, is_pending: c.is_pending } : s)
    }
  }

  const tabFiltered = conversations.filter(c =>
    tab === 'all' ? true : tab === 'unread' ? c.unread_count > 0 : c.is_pending
  )
  const filteredConversations = tabFiltered.filter(c =>
    !search ||
    c.phone.includes(search) ||
    (c.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const unreadCount = conversations.filter(c => c.unread_count > 0).length
  const pendingCount = conversations.filter(c => c.is_pending).length

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">WhatsApp</h1>
          </div>
        </div>

        {isSuperAdmin && (
          <ClinicPicker value={clinicId} onChange={setClinicId} clinics={clinics} adminUnread={adminUnread} />
        )}
      </div>

      {clinicId === ADMIN_SCOPE && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-800">
              Modo administrador: los mensajes se envían como ConsentsPro, a cualquier clínica o persona — no en nombre de ninguna clínica.
            </p>
          </div>
        </div>
      )}

      {clinicId && clinicId !== ADMIN_SCOPE && <DirectLinkPanel clinicId={clinicId} />}

      {!clinicId ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-20">
          {isSuperAdmin ? 'Selecciona una clínica para gestionar su WhatsApp' : 'Cargando…'}
        </div>
      ) : configured === false ? (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">YCloud no está configurado para esta clínica</p>
            <p className="text-xs text-amber-700 mt-1">
              {isSuperAdmin
                ? 'Añade la API Key de YCloud en Configuración → Claves para esta clínica.'
                : 'Contacta con el administrador para activar WhatsApp en esta clínica.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 min-h-[600px]">
          {/* Conversation list */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex flex-col gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar conversación…"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => { setShowNewChat(true); setSelected(null); setMessages([]) }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 text-left px-1"
              >
                + Nuevo mensaje
              </button>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {([
                  ['all', 'Todos', conversations.length],
                  ['unread', 'No leídos', unreadCount],
                  ['pending', 'Pendiente de gestión', pendingCount],
                ] as const).map(([key, label, count]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      tab === key ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {label}
                    {count > 0 && <span className="text-[10px] text-slate-400">({count})</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {tab === 'unread' ? 'No hay conversaciones sin leer' : tab === 'pending' ? 'No hay conversaciones pendientes de gestión' : 'No hay conversaciones todavía'}
                </div>
              ) : (
                filteredConversations.map(c => (
                  <div
                    key={c.id}
                    className={`w-full flex items-start gap-2 pl-4 pr-2 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      selected?.id === c.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => { setShowNewChat(false); openConversation(c) }}
                      className="flex items-start gap-3 text-left flex-1 min-w-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(c.contact_name ?? c.phone).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">{c.contact_name ?? c.phone}</p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {new Date(c.last_message_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{c.last_message_preview ?? c.phone}</p>
                        {c.source === 'recencia_automatica' && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            <RefreshCcw className="w-2.5 h-2.5" /> Enrutada por recencia — revisar
                          </span>
                        )}
                      </div>
                      {c.unread_count > 0 && (
                        <span className="flex-shrink-0 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={e => togglePending(c, e)}
                      title={c.is_pending ? 'Desmarcar pendiente de gestión' : 'Marcar como pendiente de gestión'}
                      className={`flex-shrink-0 p-1.5 rounded-lg ${c.is_pending ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'}`}
                    >
                      <Flag className="w-4 h-4" fill={c.is_pending ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat panel */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            {showNewChat ? (
              <>
                <div className="p-4 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-700 mb-2">Nuevo mensaje</p>
                  <input
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1" />
                <ChatComposer
                  draft={draft}
                  setDraft={setDraft}
                  onSend={handleSend}
                  sending={sending}
                  disabled={!newPhone.trim()}
                />
              </>
            ) : !selected ? (
              <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">
                Selecciona una conversación o inicia un mensaje nuevo
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                    {(selected.contact_name ?? selected.phone).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{selected.contact_name ?? selected.phone}</p>
                    <p className="text-xs text-slate-400">{selected.phone}</p>
                  </div>
                  <button
                    onClick={e => togglePending(selected, e)}
                    title={selected.is_pending ? 'Desmarcar pendiente de gestión' : 'Marcar como pendiente de gestión'}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                      selected.is_pending
                        ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100'
                        : 'text-slate-400 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" fill={selected.is_pending ? 'currentColor' : 'none'} />
                    {selected.is_pending ? 'Pendiente' : 'Marcar pendiente'}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-slate-50">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        m.direction === 'outbound'
                          ? 'bg-emerald-500 text-white rounded-br-sm'
                          : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
                      }`}>
                        <p className="whitespace-pre-line">{m.body}</p>
                        <div className={`flex items-center gap-1 mt-1 ${m.direction === 'outbound' ? 'justify-end text-emerald-100' : 'text-slate-400'}`}>
                          <span className="text-[10px]">
                            {new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {m.direction === 'outbound' && (
                            m.status === 'failed' ? <AlertTriangle className="w-3 h-3 text-red-200" /> :
                            m.status === 'read' ? <CheckCheck className="w-3 h-3" /> :
                            m.status === 'delivered' ? <CheckCheck className="w-3 h-3" /> :
                            m.status === 'sent' ? <Check className="w-3 h-3" /> :
                            <Clock className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <ChatComposer draft={draft} setDraft={setDraft} onSend={handleSend} sending={sending} />
              </>
            )}
            {notice && (
              <div className="px-4 py-2 bg-amber-50 text-amber-700 text-xs border-t border-amber-100">{notice}</div>
            )}
            {error && (
              <div className="px-4 py-2 bg-red-50 text-red-600 text-xs border-t border-red-100">{error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ChatComposer({ draft, setDraft, onSend, sending, disabled }: {
  draft: string; setDraft: (v: string) => void; onSend: () => void; sending: boolean; disabled?: boolean
}) {
  return (
    <div className="p-3 border-t border-slate-100 flex items-end gap-2">
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        placeholder="Escribe un mensaje…"
        rows={1}
        disabled={disabled}
        className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
      />
      <button
        onClick={onSend}
        disabled={sending || !draft.trim() || disabled}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
