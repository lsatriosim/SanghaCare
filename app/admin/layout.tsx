// app/admin/layout.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, LayoutDashboard, Database, LogOut, Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMasterOpen, setIsMasterOpen] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false) // State untuk kontrol pop-up
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-sangha-light">
      {/* Sidebar */}
      <aside className="w-64 bg-sangha-dark text-white flex flex-col shadow-md">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-sangha-primary/30">
          <h2 className="text-xl font-bold tracking-wide text-sangha-cream">SanghaCare</h2>
          <p className="text-xs text-gray-400 mt-1">Panel Pengurus</p>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Menu Dashboard */}
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/admin'
                ? 'bg-sangha-primary text-white'
                : 'text-gray-300 hover:bg-sangha-primary/40 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          {/* Menu Daftar Tiket */}
          <Link
            href="/admin/tickets"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/admin/tickets'
                ? 'bg-sangha-primary text-white'
                : 'text-gray-300 hover:bg-sangha-primary/40 hover:text-white'
            }`}
          >
            <Ticket size={18} />
            Daftar Tiket
          </Link>

          {/* Menu Accordion: Master Data */}
          <div>
            <button
              onClick={() => setIsMasterOpen(!isMasterOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-sangha-primary/40 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database size={18} />
                <span>Master Data</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  isMasterOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Sub Menu (Accordion Content) */}
            {isMasterOpen && (
              <div className="pl-11 pr-2 py-1 space-y-1 mt-1 border-l border-sangha-primary/30 ml-4">
                <Link
                  href="/admin/categories"
                  className={`block px-3 py-2 rounded-md text-xs transition-colors ${
                    pathname === '/admin/categories'
                      ? 'text-white bg-sangha-primary/30 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-sangha-primary/20'
                  }`}
                >
                  Kategori Tiket
                </Link>
                <Link
                  href="/admin/locations"
                  className={`block px-3 py-2 rounded-md text-xs transition-colors ${
                    pathname === '/admin/locations'
                      ? 'text-white bg-sangha-primary/30 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-sangha-primary/20'
                  }`}
                >
                  Lokasi
                </Link>
                <Link
                  href="/admin/bhikkhu"
                  className={`block px-3 py-2 rounded-md text-xs transition-colors ${
                    pathname === '/admin/bhikkhu'
                      ? 'text-white bg-sangha-primary/30 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-sangha-primary/20'
                  }`}
                >
                  Data Bhikkhu
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer / Logout Button */}
        <div className="p-4 border-t border-sangha-primary/30">
          <button
            onClick={() => setIsLogoutOpen(true)} // Memicu modal konfirmasi
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-300 hover:bg-red-950/40 hover:text-red-200 transition-colors"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-sangha-cream flex items-center justify-between px-8 shadow-xs">
          <h1 className="text-lg font-semibold text-sangha-dark">Dashboard Pengurus</h1>
          <div className="text-sm text-gray-600">Admin Panel</div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>

      {/* Dialog / Pop-up Konfirmasi Logout */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="bg-white border-sangha-cream">
          <DialogHeader>
            <DialogTitle className="text-sangha-dark">Konfirmasi Keluar</DialogTitle>
            <DialogDescription className="text-gray-600">
              Apakah Anda yakin ingin keluar dari sesi panel pengurus SanghaCare? Anda harus masuk kembali untuk mengakses halaman admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsLogoutOpen(false)}
              className="border-gray-300 text-gray-700"
            >
              Batal
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ya, Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}