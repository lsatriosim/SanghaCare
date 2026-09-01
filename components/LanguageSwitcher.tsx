// components/LanguageSwitcher.tsx
'use client'

import { Globe } from 'lucide-react'

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const toggleLanguage = (newLocale: string) => {
    // 1. Simpan preferensi ke cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    
    // 2. Lakukan reload penuh halaman agar cookie langsung terbaca sempurna
    window.location.reload()
  }

  const languages = [
    { code: 'id', label: 'ID' },
    { code: 'en', label: 'EN' },
    { code: 'th', label: 'TH' },
  ]

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
      <Globe size={14} className="text-gray-500 ml-1.5" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => toggleLanguage(lang.code)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            currentLocale === lang.code ? 'bg-white text-sangha-dark shadow-xs' : 'text-gray-600 hover:text-black'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}