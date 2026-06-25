import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LanguageStore {
  currentLanguage: string
  setLanguage: (lang: string) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      currentLanguage: localStorage.getItem('consentspro_lang') || import.meta.env.VITE_DEFAULT_LANGUAGE || 'es-ES',
      setLanguage: (lang) => set({ currentLanguage: lang }),
    }),
    { name: 'consentspro_lang_store' }
  )
)
