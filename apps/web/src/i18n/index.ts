import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

export const SUPPORTED_LANGUAGES = [
  { code: 'es-ES', name: 'Español', flag: '🇪🇸', region: 'España' },
  { code: 'es-MX', name: 'Español (MX)', flag: '🇲🇽', region: 'México' },
  { code: 'es-AR', name: 'Español (AR)', flag: '🇦🇷', region: 'Argentina' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧', region: 'United Kingdom' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', region: 'United States' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷', region: 'France' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪', region: 'Deutschland' },
  { code: 'pt-PT', name: 'Português', flag: '🇵🇹', region: 'Portugal' },
  { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷', region: 'Brasil' },
  { code: 'it-IT', name: 'Italiano', flag: '🇮🇹', region: 'Italia' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳', region: '中国' },
  { code: 'ar-SA', name: 'العربية', flag: '🇸🇦', region: 'المملكة العربية السعودية' },
  { code: 'ru-RU', name: 'Русский', flag: '🇷🇺', region: 'Россия' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵', region: '日本' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷', region: '대한민국' },
  { code: 'nl-NL', name: 'Nederlands', flag: '🇳🇱', region: 'Nederland' },
  { code: 'pl-PL', name: 'Polski', flag: '🇵🇱', region: 'Polska' },
  { code: 'tr-TR', name: 'Türkçe', flag: '🇹🇷', region: 'Türkiye' },
  { code: 'sv-SE', name: 'Svenska', flag: '🇸🇪', region: 'Sverige' },
  { code: 'ro-RO', name: 'Română', flag: '🇷🇴', region: 'România' },
  { code: 'no-NO', name: 'Norsk', flag: '🇳🇴', region: 'Norge' },
  { code: 'da-DK', name: 'Dansk', flag: '🇩🇰', region: 'Danmark' },
  { code: 'fi-FI', name: 'Suomi', flag: '🇫🇮', region: 'Suomi' },
  { code: 'el-GR', name: 'Ελληνικά', flag: '🇬🇷', region: 'Ελλάδα' },
  { code: 'cs-CZ', name: 'Čeština', flag: '🇨🇿', region: 'Česká republika' },
  { code: 'hu-HU', name: 'Magyar', flag: '🇭🇺', region: 'Magyarország' },
  { code: 'ca-ES', name: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿', region: 'Catalunya' },
  { code: 'uk-UA', name: 'Українська', flag: '🇺🇦', region: 'Україна' },
  { code: 'he-IL', name: 'עברית', flag: '🇮🇱', region: 'ישראל' },
  { code: 'hi-IN', name: 'हिन्दी', flag: '🇮🇳', region: 'भारत' },
  { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳', region: 'Việt Nam' },
]

const loadLocale = async (lang: string) => {
  try {
    const module = await import(`./locales/${lang}/translation.json`)
    return module.default
  } catch {
    const module = await import('./locales/es-ES/translation.json')
    return module.default
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es-ES',
    interpolation: { escapeValue: false },
    resources: {},
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'consentspro_lang',
    },
  })

// Lazy load initial language
const savedLang = localStorage.getItem('consentspro_lang') || 'es-ES'
export const i18nReady = loadLocale(savedLang).then(translations => {
  i18n.addResourceBundle(savedLang, 'translation', translations, true, true)
  return i18n.changeLanguage(savedLang)
})

export default i18n
