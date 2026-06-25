import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, Stethoscope, FileText, Building2, BookOpen } from 'lucide-react'
import { LanguageSelector } from '../language/LanguageSelector'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/patients', icon: Users, label: 'nav.patients' },
  { to: '/doctors', icon: Stethoscope, label: 'nav.doctors' },
  { to: '/consents', icon: FileText, label: 'nav.consents' },
  { to: '/templates', icon: BookOpen, label: 'nav.templates' },
  { to: '/clinic', icon: Building2, label: 'nav.clinic' },
]

export function Sidebar() {
  const { t } = useTranslation()
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
      </nav>

      {/* Language selector — bottom of sidebar, always visible */}
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
