'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (newLocale: string) => {
    // Also set the cookie, so a future bare "/user" visit defaults sensibly
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`

    const segments = pathname.split('/')
    segments[1] = newLocale // first segment after the leading slash is the locale
    router.push(segments.join('/'))
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
          onClick={() => switchLanguage(lang.code)}
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