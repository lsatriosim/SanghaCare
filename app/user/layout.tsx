'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getDictionary, getClientLocale } from '@/lib/dictionary'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<'id' | 'en' | 'th'>('id')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setLocale(getClientLocale())
  }, [])

  // Ambil kamus terpusat
  const dict = getDictionary(locale)
  const t = dict.layout

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-sangha-light flex flex-col">
      <header className="bg-white border-b border-sangha-cream sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg text-sangha-dark">{t.portalTitle}</span>
            <nav className="hidden sm:flex items-center gap-2">
              <Link
                href="/user"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/user' ? 'bg-sangha-primary text-white' : 'text-gray-600 hover:bg-sangha-light hover:text-sangha-dark'
                }`}
              >
                {t.myTickets}
              </Link>
              <Link
                href="/user/create"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/user/create' ? 'bg-sangha-primary text-white' : 'text-gray-600 hover:bg-sangha-light hover:text-sangha-dark'
                }`}
              >
                {t.createTicket}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
            >
              <LogOut size={16} />
              {t.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}