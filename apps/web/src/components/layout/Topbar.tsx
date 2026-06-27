import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../language/LanguageSelector'
import { clearSession } from '../../lib/auth'

export function Topbar() {
  const { t } = useTranslation()
  return (
    <header className="h-16 bg-gradient-to-r from-brand to-brand-light flex items-center px-6 gap-4 shadow-md sticky top-0 z-50">
      <div className="flex flex-col">
        <span className="text-white font-bold text-lg leading-none">
          Consents<span className="text-yellow-400 underline underline-offset-2">Pro</span>
        </span>
        <span className="text-white/70 text-xs">Consentimientos Digitales · Huella Digital</span>
        <span className="text-yellow-400 text-[10px]">eIDAS (UE 910/2014) · Ley 41/2002 · RGPD</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <LanguageSelector />
        <button
          onClick={() => { clearSession(); window.location.href = '/' }}
          className="text-white/80 hover:text-white text-sm border border-white/20 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors"
        >
          {t('nav.logout')}
        </button>
      </div>
    </header>
  )
}
