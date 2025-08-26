'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, t, TranslationKey } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('da') // Default to Danish

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('pos-language') as Language
    if (savedLanguage && (savedLanguage === 'da' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('pos-language', lang)
  }

  // Translation function
  const translate = (key: TranslationKey) => t(key, language)

  const value = {
    language,
    setLanguage,
    t: translate
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Hook for easy translation access
export function useTranslation() {
  const { t } = useLanguage()
  return { t }
}
