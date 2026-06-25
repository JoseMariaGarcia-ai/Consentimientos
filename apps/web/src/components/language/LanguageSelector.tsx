import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '../../store/languageStore'
import { SUPPORTED_LANGUAGES } from '../../i18n'
import { ChevronDown, Check, Search } from 'lucide-react'

interface Props {
  variant?: 'topbar' | 'sidebar' | 'light'
}

export function LanguageSelector({ variant = 'topbar' }: Props) {
  const { t, i18n } = useTranslation()
  const { currentLanguage, setLanguage } = useLanguageStore()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const current = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) ?? SUPPORTED_LANGUAGES[0]

  const filtered = SUPPORTED_LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.region.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = async (code: string) => {
    setLanguage(code)
    localStorage.setItem('consentspro_lang', code)
    try {
      const module = await import(`../../i18n/locales/${code}/translation.json`)
      i18n.addResourceBundle(code, 'translation', module.default, true, true)
    } catch {
      // fallback handled by i18n config
    }
    await i18n.changeLanguage(code)
    setOpen(false)
    setSearch('')
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const buttonCls =
    variant === 'sidebar'
      ? 'w-full flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl px-3 py-2 text-sm transition-colors border border-slate-200'
      : variant === 'light'
      ? 'flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-1.5 text-sm transition-colors border border-slate-200 shadow-sm'
      : 'flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 text-sm transition-colors border border-white/20'

  const dropdownCls =
    variant === 'sidebar'
      ? 'absolute left-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] overflow-hidden'
      : 'absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] overflow-hidden'

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(prev => !prev)} className={buttonCls} aria-label={t('language.select')}>
        <span className="text-base leading-none">{current.flag}</span>
        <span className="font-medium flex-1 text-left">{current.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={dropdownCls}>
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('language.search')}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">{t('common.no_data')}</div>
            ) : (
              filtered.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-left ${
                    lang.code === currentLanguage ? 'bg-blue-50 text-brand' : 'text-slate-700'
                  }`}
                >
                  <span className="text-base leading-none w-6 text-center">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{lang.name}</div>
                    <div className="text-xs text-slate-400 truncate">{lang.region}</div>
                  </div>
                  {lang.code === currentLanguage && <Check className="w-4 h-4 text-brand flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
