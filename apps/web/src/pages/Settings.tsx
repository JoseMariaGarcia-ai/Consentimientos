import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Plus, Pencil, Trash2, Shield, ShieldCheck, Mail, ToggleLeft, ToggleRight, FileText, ClipboardList, Camera, Megaphone, Stethoscope, UserCheck, FlaskConical, Eye, KeyRound, Save, Building2, Layers, Check, BarChart3, FileUp, Tablet, CreditCard, Ticket, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { CreativesGallery } from '@/components/media/CreativesGallery'
import { WelcomeTriggerConfig } from '@/components/media/WelcomeTriggerConfig'
import { DemoPreviewPanel } from '@/components/settings/DemoPreviewPanel'
import { PlanPermissionsPanel } from '@/components/settings/PlanPermissionsPanel'
import { AnalyticsPanel } from '@/components/settings/AnalyticsPanel'
import { SigningDevicesPanel } from '@/components/settings/SigningDevicesPanel'
import { SubscriptionsPanel } from '@/components/settings/SubscriptionsPanel'
import { PromoCodesPanel } from '@/components/settings/PromoCodesPanel'
import { useAuth } from '@/lib/auth'
import { ALL_MODULES } from '@/lib/modules'

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-800',
  doctor: 'bg-emerald-100 text-emerald-700',
  receptionist: 'bg-sky-100 text-sky-700',
  superadmin: 'bg-purple-100 text-purple-700',
  lab_partner: 'bg-amber-100 text-amber-700',
  patient: 'bg-pink-100 text-pink-700',
}
const roleBadgeClass = (role: string) => ROLE_BADGE[role] ?? 'bg-slate-100 text-slate-600'

const ROLE_LABEL_KEY: Record<string, string> = {
  superadmin:   'settings.users.role_superadmin',
  admin:        'settings.users.role_admin',
  clinica:      'settings.users.role_clinica',
  doctor:       'settings.users.role_doctor',
  receptionist: 'settings.users.role_receptionist',
  lab_partner:  'settings.users.role_lab_partner',
  patient:      'settings.users.role_patient',
}
const roleLabel = (role: string, t: (key: string) => string) => t(ROLE_LABEL_KEY[role] ?? role)

// No hay un enlace de invitación con caducidad propia (el acceso es por
// magic link, uno nuevo cada vez) — "pendiente"/"caducada" es una
// aproximación basada en cuánto tiempo lleva sin iniciar sesión desde que
// se le dio de alta.
const INVITE_EXPIRY_DAYS = 7
function inviteStatus(user: AppUser, t: (key: string) => string): { label: string; className: string } {
  if (user.last_login) return { label: t('settings.users.invite_accepted'), className: 'bg-emerald-50 text-emerald-700' }
  const ageDays = (Date.now() - new Date(user.invited_at).getTime()) / (1000 * 60 * 60 * 24)
  if (ageDays > INVITE_EXPIRY_DAYS) return { label: t('settings.users.invite_expired'), className: 'bg-red-50 text-red-600' }
  return { label: t('settings.users.invite_pending'), className: 'bg-amber-50 text-amber-700' }
}

const ROLE_FILTERS = [
  { value: 'all',          labelKey: 'settings.users.filter_all' },
  { value: 'superadmin',   labelKey: 'settings.users.role_superadmin' },
  { value: 'clinica',      labelKey: 'settings.users.role_clinica' },
  { value: 'lab_partner',  labelKey: 'settings.users.role_lab_partner' },
  { value: 'patient',      labelKey: 'settings.users.role_patient' },
]

interface AppUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  invited_at: string
  last_login: string | null
  user_permissions: { module: string; can_access: boolean }[]
}

interface LabPartner { id: string; name: string }

const ROLE_OPTIONS = [
  { value: 'superadmin',  labelKey: 'settings.users.role_superadmin',  icon: ShieldCheck,  color: 'purple'  },
  { value: 'clinica',     labelKey: 'settings.users.role_clinica',     icon: UserCheck,    color: 'sky'     },
  { value: 'doctor',      labelKey: 'settings.users.role_doctor',      icon: Stethoscope,  color: 'emerald' },
  { value: 'lab_partner', labelKey: 'settings.users.role_lab_partner', icon: FlaskConical, color: 'amber'   },
]

const ROLE_ACTIVE: Record<string, string> = {
  superadmin:  'border-purple-500 bg-purple-50 text-purple-700',
  clinica:     'border-sky-500 bg-sky-50 text-sky-700',
  doctor:      'border-emerald-500 bg-emerald-50 text-emerald-700',
  lab_partner: 'border-amber-500 bg-amber-50 text-amber-700',
}

const PLAN_IDS = ['base', 'pro', 'ia', 'ia-plus']
const PLAN_KEY: Record<string, string> = { base: 'base', pro: 'pro', ia: 'ia', 'ia-plus': 'ia_plus' }

interface UserModalProps {
  user: AppUser | null
  onClose: () => void
  onSaved: () => void
}

function UserModal({ user, onClose, onSaved }: UserModalProps) {
  const { t } = useTranslation()
  const isEdit = !!user
  const [form, setForm] = useState({
    email:          user?.email ?? '',
    full_name:      user?.full_name ?? '',
    role:           user?.role ?? 'clinica',
    lab_partner_id: (user as any)?.lab_partner_id ?? '',
    plan:           '',
  })
  const [planMatrix, setPlanMatrix] = useState<Record<string, Record<string, boolean>>>({})
  const [labs, setLabs] = useState<LabPartner[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/lab-partners').then((data: any) => setLabs(Array.isArray(data) ? data : [])).catch(() => {})
    api.get('/plan-permissions').then((data: any) => setPlanMatrix(data ?? {})).catch(() => {})
    // Pre-fill with the current clinic's plan, if any (only correct when the
    // editor manages their own clinic — a superadmin editing another
    // clinic's user still has to pick the plan explicitly).
    api.get('/clinic').then((data: any) => {
      if (data?.plan) setForm(f => (f.plan ? f : { ...f, plan: data.plan }))
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!form.email || !form.full_name) { setError(t('common.required')); return }
    if (form.role === 'clinica' && !form.plan) { setError(t('settings.users.plan_required')); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        full_name:      form.full_name,
        role:           form.role,
        lab_partner_id: form.role === 'lab_partner' ? (form.lab_partner_id || null) : null,
        plan:           form.role === 'clinica' ? form.plan : undefined,
      }
      if (isEdit) {
        await api.put(`/users/${user.id}`, { ...payload, is_active: user.is_active })
      } else {
        await api.post('/users', { email: form.email, ...payload })
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? t('settings.users.edit_user') : t('settings.users.invite_user')}
          </h2>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('patients.email')}</label>
              <input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                type="email"
                placeholder={t('settings.users.email_placeholder')}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('settings.users.full_name')}</label>
            <input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder={t('settings.users.full_name_placeholder')}
              className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('settings.users.role')}</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(r => {
                const Icon = r.icon
                const active = form.role === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      active ? ROLE_ACTIVE[r.value] : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(r.labelKey)}
                  </button>
                )
              })}
            </div>
            {form.role === 'admin' && (
              <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
                {t('settings.users.admin_hint')}
              </p>
            )}
          </div>

          {/* Lab partner selector */}
          {form.role === 'lab_partner' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('settings.users.linked_lab')}</label>
              <select
                value={form.lab_partner_id}
                onChange={e => setForm(f => ({ ...f, lab_partner_id: e.target.value }))}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">{t('settings.users.no_lab')}</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <p className="text-xs text-slate-400">{t('settings.users.lab_hint')}</p>
            </div>
          )}

          {/* Plan selector + resulting permissions preview (only for clinica role) */}
          {form.role === 'clinica' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('settings.users.plan')}</label>
              <div className="grid grid-cols-2 gap-2">
                {PLAN_IDS.map(planId => (
                  <button
                    key={planId}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, plan: planId }))}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                      form.plan === planId ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t(`recharge.plans.${PLAN_KEY[planId]}.name`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">{t('settings.users.plan_hint')}</p>

              {form.plan && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mt-1">
                  {ALL_MODULES.filter(mod => mod.key !== 'settings').map((mod, i, arr) => {
                    const hasAccess = !!planMatrix[form.plan]?.[mod.key]
                    return (
                      <div
                        key={mod.key}
                        className={`flex items-center justify-between px-4 py-2.5 ${
                          i < arr.length - 1 ? 'border-b border-slate-100' : ''
                        }`}
                      >
                        <span className={`text-sm ${hasAccess ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{t(mod.labelKey)}</span>
                        {hasAccess
                          ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          : <span className="text-slate-300 text-xs flex-shrink-0">—</span>
                        }
                      </div>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{t('settings.users.admin_only_hint')}</p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('common.saving') : isEdit ? t('common.save') : t('settings.users.send_invite')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Interruptor de proveedor de IA (sistema, no por clínica) ────── */
function AiProviderSwitch() {
  const { t } = useTranslation()
  const [provider, setProvider] = useState<'anthropic' | 'openrouter' | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/clinic-config/ai-provider').then((r: any) => setProvider(r?.provider ?? 'anthropic')).catch(() => setProvider('anthropic'))
  }, [])

  const handleChange = async (next: 'anthropic' | 'openrouter') => {
    setSaving(true)
    try {
      await api.put('/clinic-config/ai-provider', { provider: next })
      setProvider(next)
    } finally { setSaving(false) }
  }

  if (provider === null) return null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <p className="text-sm font-bold text-slate-700">{t('settings.apiKeys.aiProviderTitle')}</p>
        <span className="ml-auto text-xs text-slate-400 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">{t('settings.apiKeys.superadminOnly')}</span>
      </div>
      <p className="text-xs text-slate-400">{t('settings.apiKeys.aiProviderHint')}</p>
      <div className="grid grid-cols-2 gap-2">
        {(['anthropic', 'openrouter'] as const).map(p => (
          <button
            key={p}
            onClick={() => handleChange(p)}
            disabled={saving}
            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-50 ${provider === p ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {p === 'anthropic' ? 'Anthropic API' : 'OpenRouter'}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Número único de WhatsApp compartido (sistema, no por clínica) ── */
function SharedYCloudKeyPanel() {
  const { t } = useTranslation()
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/clinic-config/shared-ycloud-key').then((r: any) => setConfigured(!!r?.configured)).catch(() => setConfigured(false))
  }, [])

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setSaving(true); setSaved(false)
    try {
      await api.put('/clinic-config/shared-ycloud-key', { apiKey })
      setConfigured(true)
      setApiKey('')
      setSaved(true)
    } finally { setSaving(false) }
  }

  if (configured === null) return null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <p className="text-sm font-bold text-slate-700">{t('settings.apiKeys.sharedYcloudTitle')}</p>
        <span className="ml-auto text-xs text-slate-400 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">{t('settings.apiKeys.superadminOnly')}</span>
      </div>
      <p className="text-xs text-slate-400">{t('settings.apiKeys.sharedYcloudHint')}</p>
      <p className="text-xs font-medium">
        {configured
          ? <span className="text-emerald-600">✓ {t('settings.apiKeys.sharedYcloudConfigured')}</span>
          : <span className="text-amber-600">{t('settings.apiKeys.sharedYcloudNotConfigured')}</span>}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder={t('settings.apiKeys.sharedYcloudPlaceholder')}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleSave}
          disabled={saving || !apiKey.trim()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('settings.apiKeys.sharedYcloudSave')}
        </button>
      </div>
      {saved && <p className="text-xs text-emerald-600 font-medium">✓ {t('settings.apiKeys.saved')}</p>}
    </div>
  )
}

/* ─── API Key única de Retell (sistema, no por clínica) ─────────────── */
function SystemRetellKeyPanel() {
  const { t } = useTranslation()
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/clinic-config/system-retell-key').then((r: any) => setConfigured(!!r?.configured)).catch(() => setConfigured(false))
  }, [])

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setSaving(true); setSaved(false)
    try {
      await api.put('/clinic-config/system-retell-key', { apiKey })
      setConfigured(true)
      setApiKey('')
      setSaved(true)
    } finally { setSaving(false) }
  }

  if (configured === null) return null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <p className="text-sm font-bold text-slate-700">{t('settings.apiKeys.systemRetellTitle')}</p>
        <span className="ml-auto text-xs text-slate-400 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">{t('settings.apiKeys.superadminOnly')}</span>
      </div>
      <p className="text-xs text-slate-400">{t('settings.apiKeys.systemRetellHint')}</p>
      <p className="text-xs font-medium">
        {configured
          ? <span className="text-emerald-600">✓ {t('settings.apiKeys.sharedYcloudConfigured')}</span>
          : <span className="text-amber-600">{t('settings.apiKeys.sharedYcloudNotConfigured')}</span>}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="key_..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleSave}
          disabled={saving || !apiKey.trim()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('settings.apiKeys.sharedYcloudSave')}
        </button>
      </div>
      {saved && <p className="text-xs text-emerald-600 font-medium">✓ {t('settings.apiKeys.saved')}</p>}
    </div>
  )
}

/* ─── NIF/CIF del emisor en las facturas de suscripción (sistema) ──── */
function IssuerBillingInfoPanel() {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({ legalName: '', taxId: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/clinic-config/issuer-billing-info')
      .then((r: any) => setForm({ legalName: r?.legalName ?? '', taxId: r?.taxId ?? '', address: r?.address ?? '' }))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('')
    try {
      await api.put('/clinic-config/issuer-billing-info', form)
      setSaved(true)
    } catch (e: any) {
      setError(e.message)
    } finally { setSaving(false) }
  }

  if (!loaded) return null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <p className="text-sm font-bold text-slate-700">{t('settings.apiKeys.issuerBillingTitle')}</p>
        <span className="ml-auto text-xs text-slate-400 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">{t('settings.apiKeys.superadminOnly')}</span>
      </div>
      <p className="text-xs text-slate-400">{t('settings.apiKeys.issuerBillingHint')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={form.legalName}
          onChange={e => setForm(f => ({ ...f, legalName: e.target.value }))}
          placeholder={t('settings.apiKeys.issuerLegalNamePlaceholder')}
          className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="text"
          value={form.taxId}
          onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
          placeholder={t('settings.apiKeys.issuerTaxIdPlaceholder')}
          className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="text"
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          placeholder={t('settings.apiKeys.issuerAddressPlaceholder')}
          className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:col-span-2"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !form.legalName.trim() || !form.taxId.trim() || !form.address.trim()}
          className="self-start px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
        {saved && <p className="text-xs text-emerald-600 font-medium">✓ {t('settings.apiKeys.saved')}</p>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

/* ─── Clinic Keys Panel (superadmin only) ─────────────────────────── */
function ClinicKeysPanel() {
  const { t } = useTranslation()
  const [clinics, setClinics]   = useState<{ id: string; name: string; trade_name: string | null }[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [form, setForm] = useState({
    knowledge_base:    '',
    prompt:            '',
    retell_prompt:     '',
    wa_ai_enabled:     false,
    retell_ai_enabled: false,
  })
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [uploadingField, setUploadingField] = useState<'knowledge_base' | 'prompt' | 'retell_prompt' | null>(null)
  const [syncingRetell, setSyncingRetell] = useState(false)
  const [retellSynced, setRetellSynced] = useState(false)

  useEffect(() => {
    api.get('/clinic-config/clinics')
      .then((data: any) => { if (Array.isArray(data)) setClinics(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setError('')
    api.get(`/clinic-config?clinicId=${selectedId}`)
      .then((data: any) => {
        setForm({
          knowledge_base:    data.knowledge_base    ?? '',
          prompt:            data.prompt            ?? '',
          retell_prompt:     data.retell_prompt     ?? '',
          wa_ai_enabled:     !!data.wa_ai_enabled,
          retell_ai_enabled: !!data.retell_ai_enabled,
        })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedId])

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true); setError(''); setSaved(false)
    try {
      await api.put('/clinic-config', { targetClinicId: selectedId, ...form })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleSyncRetell = async () => {
    if (!selectedId) return
    setSyncingRetell(true); setError(''); setRetellSynced(false)
    try {
      await api.put('/clinic-config', { targetClinicId: selectedId, ...form })
      await api.post('/retell/sync', { targetClinicId: selectedId })
      setRetellSynced(true)
      setTimeout(() => setRetellSynced(false), 4000)
    } catch (e: any) { setError(e.message) }
    finally { setSyncingRetell(false) }
  }

  // Lets the admin upload a PDF instead of retyping the prompt / knowledge
  // base by hand — the extracted text lands in the memo field, still fully
  // editable afterwards, it doesn't replace the textarea.
  const handlePdfUpload = async (field: 'knowledge_base' | 'prompt' | 'retell_prompt', file: File) => {
    setUploadingField(field)
    setError('')
    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const { text } = await api.post('/clinic-config/extract-pdf', { fileBase64 })
      setForm(f => ({ ...f, [field]: text }))
    } catch (e: any) {
      setError(e.message || t('settings.apiKeys.extractPdfError'))
    } finally {
      setUploadingField(null)
    }
  }

  const Field = ({ label, value, onChange, type = 'text', hint, onPdfUpload, uploading }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string
    onPdfUpload?: (file: File) => void; uploading?: boolean
  }) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
        {onPdfUpload && (
          <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer ${uploading ? 'text-slate-300' : 'text-purple-600 hover:text-purple-700'}`}>
            <FileUp className="w-3.5 h-3.5" />
            {uploading ? t('settings.apiKeys.readingPdf') : t('settings.apiKeys.uploadPdf')}
            <input
              type="file"
              accept="application/pdf"
              disabled={uploading}
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) onPdfUpload(file)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={6}
          className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono resize-y"
          placeholder={hint}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={hint}
          className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
        />
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <AiProviderSwitch />
      <SharedYCloudKeyPanel />
      <SystemRetellKeyPanel />
      <IssuerBillingInfoPanel />

      {/* Clinic selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-purple-500" />
          <p className="text-sm font-bold text-slate-700">{t('settings.apiKeys.selectClinic')}</p>
        </div>
        {clinics.length === 0 ? (
          <ClinicSelectorFallback onSelect={setSelectedId} selectedId={selectedId} />
        ) : (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">{t('settings.apiKeys.selectPlaceholder')}</option>
            {clinics.map(c => (
              <option key={c.id} value={c.id}>{c.trade_name ?? c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Keys form */}
      {selectedId && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-700">{t('settings.apiKeys.title')}</h3>
            <span className="ml-auto text-xs text-slate-400 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">{t('settings.apiKeys.superadminOnly')}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <Field
                  label={t('settings.apiKeys.knowledgeBase')}
                  value={form.knowledge_base}
                  onChange={v => setForm(f => ({ ...f, knowledge_base: v }))}
                  type="textarea"
                  hint={t('settings.apiKeys.knowledgeBaseHint')}
                  onPdfUpload={file => handlePdfUpload('knowledge_base', file)}
                  uploading={uploadingField === 'knowledge_base'}
                />
                <Field
                  label={t('settings.apiKeys.prompt')}
                  value={form.prompt}
                  onChange={v => setForm(f => ({ ...f, prompt: v }))}
                  type="textarea"
                  hint={t('settings.apiKeys.promptHint')}
                  onPdfUpload={file => handlePdfUpload('prompt', file)}
                  uploading={uploadingField === 'prompt'}
                />
                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.wa_ai_enabled}
                    onChange={e => setForm(f => ({ ...f, wa_ai_enabled: e.target.checked }))}
                    className="w-4 h-4 accent-purple-600"
                  />
                  {t('settings.apiKeys.waAiEnabled')}
                </label>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.apiKeys.retellSection')}</h4>
                </div>
                <Field
                  label={t('settings.apiKeys.retellPrompt')}
                  value={form.retell_prompt}
                  onChange={v => setForm(f => ({ ...f, retell_prompt: v }))}
                  type="textarea"
                  hint={t('settings.apiKeys.retellPromptHint')}
                  onPdfUpload={file => handlePdfUpload('retell_prompt', file)}
                  uploading={uploadingField === 'retell_prompt'}
                />
                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.retell_ai_enabled}
                    onChange={e => setForm(f => ({ ...f, retell_ai_enabled: e.target.checked }))}
                    className="w-4 h-4 accent-purple-600"
                  />
                  {t('settings.apiKeys.retellAiEnabled')}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSyncRetell}
                    disabled={syncingRetell || !form.retell_prompt}
                    className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {syncingRetell ? t('settings.apiKeys.retellSyncing') : t('settings.apiKeys.retellSync')}
                  </button>
                  {retellSynced && <span className="text-sm text-emerald-600 font-medium">✓ {t('settings.apiKeys.retellSynced')}</span>}
                </div>
                <p className="text-xs text-slate-400">{t('settings.apiKeys.retellSyncHint')}</p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {saved && <span className="text-sm text-emerald-600 font-medium">✓ {t('settings.apiKeys.saved')}</span>}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? t('settings.apiKeys.saving') : t('settings.apiKeys.save')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ClinicSelectorFallback({ onSelect, selectedId }: { onSelect: (id: string) => void; selectedId: string }) {
  const { t } = useTranslation()
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    // Fallback: get clinic from the logged-in user's own clinic
    api.get('/clinic').then((data: any) => {
      if (data?.id) setClinics([{ id: data.id, name: data.trade_name ?? data.name ?? t('settings.apiKeys.defaultClinicName') }])
    }).catch(() => {})
  }, [t])
  return (
    <select
      value={selectedId}
      onChange={e => onSelect(e.target.value)}
      className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      <option value="">{t('settings.apiKeys.selectPlaceholder')}</option>
      {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  )
}

export default function Settings() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const isSuperAdmin = role === 'superadmin'
  const isAdmin = role === 'admin' || isSuperAdmin
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [modal, setModal] = useState<{ open: boolean; user: AppUser | null }>({ open: false, user: null })
  const [deleting, setDeleting] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    setUsersError('')
    try {
      const data = await api.get('/users')
      setUsers(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setUsers([])
      setUsersError(e?.message || t('settings.users.load_error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggleActive = async (user: AppUser) => {
    await api.put(`/users/${user.id}`, { ...user, is_active: !user.is_active })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.confirm_delete'))) return
    setDeleting(id)
    try {
      await api.delete(`/users/${id}`)
      await load()
    } catch (e: any) {
      alert(e.message ?? t('settings.users.delete_error'))
    } finally {
      setDeleting(null)
    }
  }

  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'users' | 'media' | 'preview' | 'keys' | 'plans' | 'analytics' | 'devices' | 'subscriptions' | 'promoCodes'>('users')
  const [mediaData, setMediaData] = useState<any>({})

  const loadMedia = async () => {
    try { setMediaData(await api.get('/media')) } catch {}
  }

  useEffect(() => { loadMedia() }, [])
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t('settings.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Users className="w-4 h-4" />{t('settings.tabs.users')}
        </button>
        <button onClick={() => setActiveTab('media')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'media' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Megaphone className="w-4 h-4" />{t('settings.tabs.media')}
        </button>
        {isSuperAdmin && (
          <>
            <button onClick={() => setActiveTab('preview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'preview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Eye className="w-4 h-4" />{t('settings.tabs.preview')}
            </button>
            <button onClick={() => setActiveTab('keys')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'keys' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <KeyRound className="w-4 h-4" />{t('settings.tabs.keys')}
            </button>
            <button onClick={() => setActiveTab('plans')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'plans' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Layers className="w-4 h-4" />{t('planPermissions.tab')}
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <BarChart3 className="w-4 h-4" />{t('settings.tabs.analytics')}
            </button>
            <button onClick={() => setActiveTab('subscriptions')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'subscriptions' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <CreditCard className="w-4 h-4" />{t('settings.tabs.subscriptions')}
            </button>
            <button onClick={() => setActiveTab('promoCodes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'promoCodes' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Ticket className="w-4 h-4" />{t('settings.tabs.promoCodes')}
            </button>
          </>
        )}
        {isAdmin && (
          <button onClick={() => setActiveTab('devices')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'devices' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Tablet className="w-4 h-4" />{t('settings.tabs.devices')}
          </button>
        )}
      </div>

      {/* Vista previa por roles — solo superadmin */}
      {activeTab === 'preview' && isSuperAdmin && <DemoPreviewPanel />}

      {/* Keys tab — superadmin only */}
      {activeTab === 'keys' && isSuperAdmin && <ClinicKeysPanel />}

      {/* Planes de suscripción — superadmin only */}
      {activeTab === 'plans' && isSuperAdmin && <PlanPermissionsPanel />}

      {/* Analítica — superadmin only */}
      {activeTab === 'analytics' && isSuperAdmin && <AnalyticsPanel />}

      {/* Suscripciones — superadmin only */}
      {activeTab === 'subscriptions' && isSuperAdmin && <SubscriptionsPanel />}

      {/* Códigos promocionales — superadmin only */}
      {activeTab === 'promoCodes' && isSuperAdmin && <PromoCodesPanel />}

      {/* Dispositivos de firma (tablet) — admin y superadmin */}
      {activeTab === 'devices' && isAdmin && <SigningDevicesPanel />}

      {/* Media / Publicidad tab */}
      {activeTab === 'media' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Megaphone className="w-4 h-4 text-pink-500" />
              <h3 className="text-sm font-bold text-slate-700">{t('settings.media.title')}</h3>
            </div>

            {mediaData?.managedByLab && (
              <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                {mediaData.managedByLabName
                  ? t('settings.media.managed_by_lab_named', { name: mediaData.managedByLabName })
                  : t('settings.media.managed_by_lab')}
              </div>
            )}

            {/* Slot 1: welcome screen — up to 5 creatives */}
            <CreativesGallery
              type="welcome"
              title={t('settings.media.welcome_title')}
              description={t('settings.media.welcome_description')}
              files={mediaData?.welcome?.files ?? []}
              settings={mediaData?.welcome?.settings ?? null}
              onChanged={loadMedia}
              readOnly={!!mediaData?.managedByLab}
            />

            {/* Trigger config — only when there is at least one creative */}
            {(mediaData?.welcome?.files?.length ?? 0) > 0 && !mediaData?.managedByLab && (
              <>
                <div className="border-t border-slate-100" />
                <WelcomeTriggerConfig
                  current={mediaData.welcome.settings}
                  onSaved={loadMedia}
                />
              </>
            )}

            <div className="border-t border-slate-100" />

            {/* Slot 2: patient content — up to 5 creatives */}
            <CreativesGallery
              type="patient"
              title={t('settings.media.patient_title')}
              description={t('settings.media.patient_description')}
              files={mediaData?.patient?.files ?? []}
              settings={mediaData?.patient?.settings ?? null}
              readOnly={!!mediaData?.managedByLab}
              onChanged={loadMedia}
            />
          </div>
        </div>
      )}

      {/* Users section */}
      {activeTab === 'users' && <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-800">{t('settings.users.title')}</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{users.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_FILTERS.map(f => <option key={f.value} value={f.value}>{t(f.labelKey)}</option>)}
            </select>
            <button
              onClick={() => setModal({ open: true, user: null })}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              {t('settings.users.invite_user')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 text-sm py-12">{t('common.loading')}</div>
        ) : usersError ? (
          <div className="text-center text-sm py-12 flex flex-col items-center gap-3 px-6">
            <Users className="w-10 h-10 opacity-20 text-red-400" />
            <p className="text-red-600 font-medium">{t('settings.users.load_error')}</p>
            <p className="text-slate-400 max-w-md">{usersError}</p>
            <button onClick={load} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
              {t('settings.users.retry')}
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center gap-3">
            <Users className="w-10 h-10 opacity-20" />
            <p>{t('settings.users.no_users')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.filter(u => roleFilter === 'all' || u.role === roleFilter).map(user => {
              const modulePerms = Object.fromEntries(
                (user.user_permissions ?? []).map(p => [p.module, p.can_access])
              )
              return (
                <div key={user.id} className={`flex items-start gap-4 px-6 py-4 ${!user.is_active ? 'opacity-50' : ''}`}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeClass(user.role)}`}>
                        {roleLabel(user.role, t)}
                      </span>
                      {!user.is_active && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{t('settings.users.inactive')}</span>
                      )}
                      {(() => {
                        const inv = inviteStatus(user, t)
                        return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${inv.className}`}>{inv.label}</span>
                      })()}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>

                    {/* Permission badges (only for clinica role) */}
                    {user.role === 'clinica' && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ALL_MODULES.filter(mod => mod.key !== 'settings').map(mod => (
                          <span
                            key={mod.key}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              modulePerms[mod.key] !== false
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-400 line-through'
                            }`}
                          >
                            {t(mod.labelKey)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions — patients are read-only (managed from Patients page) */}
                  {user.role !== 'patient' && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggleActive(user)}
                        title={user.is_active ? t('settings.users.deactivate') : t('settings.users.activate')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        {user.is_active
                          ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                          : <ToggleLeft className="w-5 h-5" />
                        }
                      </button>
                      <button
                        onClick={() => setModal({ open: true, user })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deleting === user.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>}

      {modal.open && (
        <UserModal
          user={modal.user}
          onClose={() => setModal({ open: false, user: null })}
          onSaved={load}
        />
      )}
    </div>
  )
}
