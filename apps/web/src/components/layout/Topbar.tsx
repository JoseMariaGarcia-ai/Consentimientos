import { useTranslation } from 'react-i18next'
import { Menu, LogOut } from 'lucide-react'
import { LanguageSelector } from '../language/LanguageSelector'
import { clearSession } from '../../lib/auth'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t } = useTranslation()
  return (
    <header className="h-16 bg-gradient-to-r from-brand to-brand-light flex items-center px-3 md:px-6 gap-2 md:gap-4 shadow-md sticky top-0 z-50">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
        aria-label={t('nav.menu', 'Menú')}
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex flex-col min-w-0">
        <span className="text-white font-bold text-base md:text-lg leading-none truncate">
          Consents<span className="text-yellow-400 underline underline-offset-2">Pro</span>
        </span>
        <span className="text-white/70 text-xs hidden sm:block truncate">Consentimientos Digitales · Huella Digital</span>
        <span className="text-yellow-400 text-[10px] hidden md:block">eIDAS (UE 910/2014) · Ley 41/2002 · RGPD</span>
      </div>
      <div className="ml-auto flex items-center gap-2 md:gap-3 flex-shrink-0">
        <LanguageSelector />
        <button
          onClick={() => { clearSession(); window.location.href = '/' }}
          className="text-white/80 hover:text-white text-sm border border-white/20 rounded-lg px-2.5 md:px-3 py-1.5 hover:bg-white/10 transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline">{t('nav.logout')}</span>
        </button>
      </div>
    </header>
  )
}
