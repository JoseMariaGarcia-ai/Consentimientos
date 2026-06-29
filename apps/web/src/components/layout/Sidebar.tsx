import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, UserCog, FileText, Building2, BookOpen, Settings, ClipboardList, Camera, Zap } from 'lucide-react'
import { LanguageSelector } from '../language/LanguageSelector'
import { useCredits } from '@/hooks/useCredits'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/patients', icon: Users, label: 'nav.patients' },
  { to: '/doctors', icon: UserCog, label: 'nav.doctors' },
  { to: '/consents', icon: FileText, label: 'nav.consents' },
  { to: '/clinical-records', icon: ClipboardList, label: 'nav.clinicalRecords' },
  { to: '/photos', icon: Camera, label: 'nav.photos' },
  { to: '/templates', icon: BookOpen, label: 'nav.templates' },
  { to: '/clinic', icon: Building2, label: 'nav.clinic' },
]

const bottomNavItems = [
  { to: '/settings', icon: Settings, label: 'nav.settings' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const { low } = useCredits()

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col py-4">
      <nav className="flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-brand' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {t(label)}
          </NavLink>
        ))}

        {/* Recargar — highlighted when credits are low */}
        <NavLink
          to="/recharge"
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
        {bottomNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
  )
}
