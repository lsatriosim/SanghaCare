// app/user/layout.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Ticket, PlusCircle, LogOut } from 'lucide-react'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-sangha-light flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-sangha-cream sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg text-sangha-dark">SanghaCare Portal</span>
            <nav className="hidden sm:flex items-center gap-2">
              <Link
                href="/user"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/user'
                    ? 'bg-sangha-primary text-white'
                    : 'text-gray-600 hover:bg-sangha-light hover:text-sangha-dark'
                }`}
              >
                Tiket Saya
              </Link>
              <Link
                href="/user/create"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/user/create'
                    ? 'bg-sangha-primary text-white'
                    : 'text-gray-600 hover:bg-sangha-light hover:text-sangha-dark'
                }`}
              >
                Buat Tiket Baru
              </Link>
            </nav>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
          >
            <LogOut size={16} />
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}