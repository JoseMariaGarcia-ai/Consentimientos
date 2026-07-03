import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, UserCog, FileText, Building2, BookOpen, Settings, ClipboardList, Camera, Zap, CalendarClock } from 'lucide-react'
import { LanguageSelector } from '../language/LanguageSelector'
import { useCredits } from '@/hooks/useCredits'

const navItems: { to: string; icon: typeof LayoutDashboard; label: string; fallback?: string; moduleKey: string }[] = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard', moduleKey: 'dashboard' },
  { to: '/agenda', icon: CalendarClock, label: 'nav.agenda', fallback: 'Agenda', moduleKey: 'agenda' },
  { to: '/patients', icon: Users, label: 'nav.patients', moduleKey: 'patients' },
  { to: '/doctors', icon: UserCog, label: 'nav.doctors', moduleKey: 'doctors' },
  { to: '/consents', icon: FileText, label: 'nav.consents', moduleKey: 'consents' },
  { to: '/clinical-records', icon: ClipboardList, label: 'nav.clinicalRecords', moduleKey: 'clinical-records' },
  { to: '/photos', icon: Camera, label: 'nav.photos', moduleKey: 'photos' },
  { to: '/templates', icon: BookOpen, label: 'nav.templates', moduleKey: 'templates' },
  { to: '/clinic', icon: Building2, label: 'nav.clinic', moduleKey: 'clinic' },
  { to: '/lab-partners', icon: Building2, label: 'nav.labPartners', fallback: 'Laboratorios', moduleKey: 'lab-partners' },
]

const bottomNavItems = [
  { to: '/settings', icon: Settings, label: 'nav.settings', moduleKey: 'settings' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  /** When set, only nav items whose moduleKey is in this list are shown (used for role preview / permission-restricted views). */
  allowedModules?: string[]
}

export function Sidebar({ open, onClose, allowedModules }: SidebarProps) {
  const { t } = useTranslation()
  const { low } = useCredits()
  const visibleNavItems = allowedModules ? navItems.filter(i => allowedModules.includes(i.moduleKey)) : navItems
  const visibleBottomItems = allowedModules ? bottomNavItems.filter(i => allowedModules.includes(i.moduleKey)) : bottomNavItems

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-56 bg-white border-r border-slate-200 flex flex-col py-4 overflow-y-auto transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1">
          {visibleNavItems.map(({ to, icon: Icon, label, fallback }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-brand' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {fallback ? t(label, fallback) : t(label)}
            </NavLink>
          ))}

          {/* Recargar — highlighted when credits are low */}
          <NavLink
            to="/recharge"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-100 text-amber-800'
                  : low
                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Zap className={`w-4 h-4 ${low ? 'text-amber-500' : ''}`} />
            {t('nav.recharge')}
            {low && <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </NavLink>
        </nav>

        {/* Settings — above language selector */}
        <div className="mx-2 pt-2 border-t border-slate-100">
          {visibleBottomItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-brand' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {t(label)}
            </NavLink>
          ))}
        </div>

        {/* Language selector */}
        <div className="mx-2 mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">
            {t('language.select', 'Idioma')}
          </p>
          <div className="px-1">
            <LanguageSelector variant="sidebar" />
          </div>
        </div>
      </aside>
    </>
  )
}
