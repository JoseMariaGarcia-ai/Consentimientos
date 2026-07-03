import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Plus, Pencil, Trash2, Shield, ShieldCheck, Mail, ToggleLeft, ToggleRight, FileText, ClipboardList, Camera, Megaphone, Stethoscope, UserCheck, FlaskConical, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { CreativesGallery } from '@/components/media/CreativesGallery'
import { WelcomeTriggerConfig } from '@/components/media/WelcomeTriggerConfig'
import { DemoPreviewPanel } from '@/components/settings/DemoPreviewPanel'
import { useAuth } from '@/lib/auth'
import { ALL_MODULES, DEFAULT_PERMS } from '@/lib/modules'

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-800',
  doctor: 'bg-emerald-100 text-emerald-700',
  receptionist: 'bg-sky-100 text-sky-700',
  superadmin: 'bg-purple-100 text-purple-700',
  lab_partner: 'bg-amber-100 text-amber-700',
  patient: 'bg-pink-100 text-pink-700',
}
const roleBadgeClass = (role: string) => ROLE_BADGE[role] ?? 'bg-slate-100 text-slate-600'

const ROLE_LABEL: Record<string, string> = {
  superadmin:   'Super Admin',
  admin:        'Administrador',
  clinica:      'Clínica',
  doctor:       'Doctor',
  receptionist: 'Recepcionista',
  lab_partner:  'Laboratorio',
  patient:      'Paciente',
}
const roleLabel = (role: string) => ROLE_LABEL[role] ?? role

const ROLE_FILTERS = [
  { value: 'all',          label: 'Todos' },
  { value: 'superadmin',   label: 'Super Admin' },
  { value: 'clinica',      label: 'Clínica' },
  { value: 'lab_partner',  label: 'Laboratorio' },
  { value: 'patient',      label: 'Paciente' },
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
  { value: 'superadmin',  label: 'Super Admin', icon: ShieldCheck,  color: 'purple' },
  { value: 'clinica',     label: 'Clínica',     icon: UserCheck,    color: 'sky'    },
  { value: 'lab_partner', label: 'Laboratorio', icon: FlaskConical, color: 'amber'  },
]

const ROLE_ACTIVE: Record<string, string> = {
  superadmin:  'border-purple-500 bg-purple-50 text-purple-700',
  clinica:     'border-sky-500 bg-sky-50 text-sky-700',
  lab_partner: 'border-amber-500 bg-amber-50 text-amber-700',
}

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
  })
  const [perms, setPerms] = useState<Record<string, boolean>>(() => {
    if (user?.user_permissions?.length) {
      return Object.fromEntries(user.user_permissions.map(p => [p.module, p.can_access]))
    }
    return { ...DEFAULT_PERMS }
  })
  const [labs, setLabs] = useState<LabPartner[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/lab-partners').then((data: any) => setLabs(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!form.email || !form.full_name) { setError(t('common.required')); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        full_name:      form.full_name,
        role:           form.role,
        lab_partner_id: form.role === 'lab_partner' ? (form.lab_partner_id || null) : null,
      }
      if (isEdit) {
        await api.put(`/users/${user.id}`, { ...payload, is_active: user.is_active })
        if (form.role === 'clinica') {
          await api.put(`/users/${user.id}/permissions`, perms)
        }
      } else {
        await api.post('/users', { email: form.email, ...payload, permissions: perms })
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
                placeholder="usuario@clinica.es"
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('settings.users.full_name')}</label>
            <input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Nombre Apellidos"
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
                    {r.label}
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
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Laboratorio vinculado</label>
              <select
                value={form.lab_partner_id}
                onChange={e => setForm(f => ({ ...f, lab_partner_id: e.target.value }))}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Sin laboratorio</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <p className="text-xs text-slate-400">El usuario solo verá las clínicas vinculadas a este laboratorio.</p>
            </div>
          )}

          {/* Permissions checklist (only for clinica role) */}
          {form.role === 'clinica' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('settings.users.permissions')}</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {ALL_MODULES.map((mod, i) => (
                  <label
                    key={mod.key}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                      i < ALL_MODULES.length - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    <span className="text-sm text-slate-700 font-medium">{t(mod.labelKey)}</span>
                    <button
                      type="button"
                      onClick={() => setPerms(p => ({ ...p, [mod.key]: !p[mod.key] }))}
                      className="flex-shrink-0"
                    >
                      {perms[mod.key]
                        ? <ToggleRight className="w-8 h-8 text-blue-600" />
                        : <ToggleLeft className="w-8 h-8 text-slate-300" />
                      }
                    </button>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400">{t('settings.users.permissions_hint')}</p>
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

export default function Settings() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const isAdmin = role === 'admin' || role === 'superadmin'
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; user: AppUser | null }>({ open: false, user: null })
  const [deleting, setDeleting] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/users')
      setUsers(Array.isArray(data) ? data : [])
    } catch (_) {
      setUsers([])
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
    await api.delete(`/users/${id}`)
    setDeleting(null)
    load()
  }

  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'users' | 'media' | 'preview'>('users')
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
          <Users className="w-4 h-4" />Usuarios
        </button>
        <button onClick={() => setActiveTab('media')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'media' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Megaphone className="w-4 h-4" />Publicidad
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('preview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'preview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Eye className="w-4 h-4" />Vista previa
          </button>
        )}
      </div>

      {/* Vista previa por roles — solo admin/superadmin */}
      {activeTab === 'preview' && isAdmin && <DemoPreviewPanel />}

      {/* Media / Publicidad tab */}
      {activeTab === 'media' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Megaphone className="w-4 h-4 text-pink-500" />
              <h3 className="text-sm font-bold text-slate-700">Gestión de medios publicitarios</h3>
            </div>

            {/* Slot 1: welcome screen — up to 5 creatives */}
            <CreativesGallery
              type="welcome"
              title="Pantalla de bienvenida"
              description="Hasta 5 imágenes o vídeos. Elige cuál mostrar, en aleatorio o en secuencia (máx. 100 MB por archivo)."
              files={mediaData?.welcome?.files ?? []}
              settings={mediaData?.welcome?.settings ?? null}
              onChanged={loadMedia}
            />

            {/* Trigger config — only when there is at least one creative */}
            {(mediaData?.welcome?.files?.length ?? 0) > 0 && (
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
              title="Contenido para paciente"
              description="Hasta 5 imágenes o vídeos destinados al paciente. Su uso exacto se configurará próximamente."
              files={mediaData?.patient?.files ?? []}
              settings={mediaData?.patient?.settings ?? null}
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
              {ROLE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
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
                        {roleLabel(user.role)}
                      </span>
                      {!user.is_active && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{t('settings.users.inactive')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>

                    {/* Permission badges (only for clinica role) */}
                    {user.role === 'clinica' && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ALL_MODULES.map(mod => (
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
