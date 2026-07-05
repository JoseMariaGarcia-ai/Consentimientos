import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Building2, Plus, Pencil, Trash2, Megaphone, Search, X } from 'lucide-react'
import { api } from '@/lib/api'

export interface LabPartner {
  id: string
  name: string
  email: string
  phone: string | null
  contact_person: string | null
  website: string | null
  notes: string | null
  is_active: boolean
  clinic_count?: number
  campaign_count?: number
}

export interface Campaign {
  id: string
  lab_partner_id: string
  name: string
  creative_type: string
  creatives: any
  rotation_mode: string
  trigger_rule: string
  trigger_interval_minutes: number | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

const CREATIVE_TYPES = ['image', 'video', 'url', 'offer', 'training']

const TRIGGERS = ['on_login', 'on_consent', 'every_x_minutes', 'once_daily']

// ── Lab form modal ──────────────────────────────────────────────
function LabForm({ initial, onSave, onClose }: { initial: Partial<LabPartner>; onSave: (d: any) => Promise<void>; onClose: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: initial.name ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    contact_person: initial.contact_person ?? '',
    website: initial.website ?? '',
    notes: initial.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) { setError(t('labPartners.form.name_email_required')); return }
    setSaving(true); setError('')
    try {
      await onSave({ ...initial, ...form })
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('labPartners.form.unknown_error'))
    } finally { setSaving(false) }
  }

  const fld = (k: keyof typeof form, label: string, req = false, type = 'text') => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}{req && <span className="text-red-500 ml-1">*</span>}</label>
      <input
        type={type}
        value={form[k]}
        onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{initial.id ? t('labPartners.form.edit_title') : t('labPartners.form.new_title')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fld('name', t('labPartners.form.name'), true)}
          {fld('email', t('labPartners.form.email'), true, 'email')}
          {fld('phone', t('labPartners.form.phone'))}
          {fld('contact_person', t('labPartners.form.contact_person'))}
          <div className="sm:col-span-2">{fld('website', t('labPartners.form.website'))}</div>
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('labPartners.form.notes')}</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {error && <div className="sm:col-span-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Campaign form modal ─────────────────────────────────────────
function CampaignForm({ initial, onSave, onClose }: { initial: Partial<Campaign>; onSave: (d: any) => Promise<void>; onClose: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: initial.name ?? '',
    creative_type: initial.creative_type ?? 'image',
    creative_url: Array.isArray(initial.creatives) ? (initial.creatives[0]?.url ?? '') : '',
    rotation_mode: initial.rotation_mode ?? 'random',
    trigger_rule: initial.trigger_rule ?? 'on_login',
    trigger_interval_minutes: initial.trigger_interval_minutes ?? 60,
    starts_at: initial.starts_at ? initial.starts_at.slice(0, 10) : '',
    ends_at: initial.ends_at ? initial.ends_at.slice(0, 10) : '',
    is_active: initial.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError(t('labPartners.campaigns.form.name_required')); return }
    setSaving(true); setError('')
    try {
      await onSave({
        name: form.name,
        creative_type: form.creative_type,
        creatives: form.creative_url ? [{ url: form.creative_url }] : [],
        rotation_mode: form.rotation_mode,
        trigger_rule: form.trigger_rule,
        trigger_interval_minutes: form.trigger_rule === 'every_x_minutes' ? Number(form.trigger_interval_minutes) : null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        is_active: form.is_active,
      })
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('labPartners.campaigns.form.unknown_error'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{initial.id ? t('labPartners.campaigns.form.edit_title') : t('labPartners.campaigns.form.new_title')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('labPartners.campaigns.form.name')}<span className="text-red-500 ml-1">*</span></label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('labPartners.campaigns.form.type')}</label>
            <select value={form.creative_type} onChange={e => setForm(f => ({ ...f, creative_type: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CREATIVE_TYPES.map(v => <option key={v} value={v}>{t(`labPartners.creative_types.${v}`)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('labPartners.campaigns.form.rotation_mode')}</label>
            <select value={form.rotation_mode} onChange={e => setForm(f => ({ ...f, rotation_mode: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="random">{t('labPartners.campaigns.form.rotation_random')}</option>
              <option value="manual">{t('labPartners.campaigns.form.rotation_manual')}</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('labPartners.campaigns.form.creative_url')}</label>
            <input value={form.creative_url} onChange={e => setForm(f => ({ ...f, creative_url: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('labPartners.campaigns.form.trigger')}</label>
            <select value={form.trigger_rule} onChange={e => setForm(f => ({ ...f, trigger_rule: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {TRIGGERS.map(v => <option key={v} value={v}>{t(`labPartners.triggers.${v}`)}</option>)}
            </select>
          </div>
          {form.trigger_rule === 'every_x_minutes' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('labPartners.campaigns.form.interval_minutes')}</label>
              <input type="number" value={form.trigger_interval_minutes} onChange={e => setForm(f => ({ ...f, trigger_interval_minutes: Number(e.target.value) }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('labPartners.campaigns.form.start_date')}</label>
            <input type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('labPartners.campaigns.form.end_date')}</label>
            <input type="date" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            {t('labPartners.campaigns.form.active')}
          </label>
          {error && <div className="sm:col-span-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Campaigns panel ─────────────────────────────────────────────
export function CampaignsPanel({ lab }: { lab: LabPartner }) {
  const { t } = useTranslation()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [form, setForm] = useState<{ open: boolean; campaign: Campaign | null }>({ open: false, campaign: null })

  const load = async () => {
    try { setCampaigns(await api.get(`/lab-partners/${lab.id}/campaigns`)) } catch { setCampaigns([]) }
  }
  useEffect(() => { load() }, [lab.id])

  const handleSave = async (data: any) => {
    if (form.campaign?.id) await api.put(`/lab-partners/${lab.id}/campaigns/${form.campaign.id}`, data)
    else await api.post(`/lab-partners/${lab.id}/campaigns`, data)
    await load()
  }

  const toggleActive = async (c: Campaign) => {
    await api.put(`/lab-partners/${lab.id}/campaigns/${c.id}`, { ...c, is_active: !c.is_active })
    await load()
  }

  const handleDelete = async (c: Campaign) => {
    if (!confirm(t('labPartners.campaigns.confirm_delete'))) return
    await api.delete(`/lab-partners/${lab.id}/campaigns/${c.id}`)
    await load()
  }

  const triggerLabel = (v: string) => t(`labPartners.triggers.${v}`)
  const typeLabel = (v: string) => t(`labPartners.creative_types.${v}`)

  return (
    <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-pink-500" />
          <h4 className="text-sm font-bold text-slate-700">{t('labPartners.campaigns.title', { name: lab.name })}</h4>
        </div>
        <button onClick={() => setForm({ open: true, campaign: null })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 text-white text-xs font-medium rounded-lg hover:bg-pink-700">
          <Plus className="w-3.5 h-3.5" />{t('labPartners.campaigns.new_campaign')}
        </button>
      </div>
      {campaigns.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">{t('labPartners.campaigns.no_campaigns')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
              <th className="py-1.5">{t('labPartners.campaigns.col_name')}</th>
              <th className="py-1.5">{t('labPartners.campaigns.col_type')}</th>
              <th className="py-1.5">{t('labPartners.campaigns.col_trigger')}</th>
              <th className="py-1.5">{t('labPartners.campaigns.col_status')}</th>
              <th className="py-1.5 text-right">{t('labPartners.campaigns.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {campaigns.map(c => (
              <tr key={c.id}>
                <td className="py-2 font-medium text-slate-700">{c.name}</td>
                <td className="py-2 text-slate-600">{typeLabel(c.creative_type)}</td>
                <td className="py-2 text-slate-600">{triggerLabel(c.trigger_rule)}</td>
                <td className="py-2">
                  <input type="checkbox" checked={c.is_active} onChange={() => toggleActive(c)} />
                </td>
                <td className="py-2 text-right">
                  <button onClick={() => setForm({ open: true, campaign: c })} className="p-1 text-slate-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(c)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {form.open && (
        <CampaignForm initial={form.campaign ?? {}} onSave={handleSave} onClose={() => setForm({ open: false, campaign: null })} />
      )}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────
export default function LabPartners() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const [labs, setLabs] = useState<LabPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<{ open: boolean; lab: LabPartner | null }>({ open: false, lab: null })
  const [expanded, setExpanded] = useState<string | null>(highlightId)

  const load = async () => {
    setLoading(true)
    try { setLabs(await api.get('/lab-partners')) } catch { setLabs([]) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!highlightId || loading) return
    setExpanded(highlightId)
    const row = document.getElementById(`lab-row-${highlightId}`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightId, loading])

  const handleSave = async (data: any) => {
    if (data.id) await api.put(`/lab-partners/${data.id}`, data)
    else await api.post('/lab-partners', data)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('labPartners.confirm_deactivate'))) return
    await api.delete(`/lab-partners/${id}`)
    await load()
  }

  const filtered = labs.filter(l =>
    [l.name, l.email, l.contact_person].some(v => (v ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('labPartners.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('labPartners.count', { count: labs.length })}</p>
        </div>
        <button onClick={() => setForm({ open: true, lab: null })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" />{t('labPartners.new_lab')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('labPartners.search_placeholder')}
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">{t('labPartners.no_labs')}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="px-6 py-3">{t('labPartners.col_name')}</th>
                <th className="px-6 py-3">{t('labPartners.col_email')}</th>
                <th className="px-6 py-3">{t('labPartners.col_contact')}</th>
                <th className="px-6 py-3">{t('labPartners.col_phone')}</th>
                <th className="px-6 py-3">{t('labPartners.col_status')}</th>
                <th className="px-6 py-3 text-right">{t('labPartners.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(lab => (
                <>
                  <tr key={lab.id} id={`lab-row-${lab.id}`} className={`${!lab.is_active ? 'opacity-50' : ''} ${lab.id === highlightId ? 'bg-amber-50' : ''}`}>
                    <td className="px-6 py-3">
                      <button onClick={() => setExpanded(expanded === lab.id ? null : lab.id)} className="flex items-center gap-2 font-medium text-slate-800 hover:text-blue-600">
                        <Building2 className="w-4 h-4 text-slate-400" />{lab.name}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{lab.email}</td>
                    <td className="px-6 py-3 text-slate-600">{lab.contact_person ?? '—'}</td>
                    <td className="px-6 py-3 text-slate-600">{lab.phone ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lab.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {lab.is_active ? t('labPartners.status_active') : t('labPartners.status_inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => setForm({ open: true, lab })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(lab.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                  {expanded === lab.id && (
                    <tr key={lab.id + '-panel'}>
                      <td colSpan={6} className="p-0"><CampaignsPanel lab={lab} /></td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form.open && (
        <LabForm initial={form.lab ?? {}} onSave={handleSave} onClose={() => setForm({ open: false, lab: null })} />
      )}
    </div>
  )
}
