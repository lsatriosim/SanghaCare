// app/admin/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, LayoutDashboard, Database, LogOut, Ticket, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react'
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
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  
  // State untuk kontrol autentikasi & otorisasi
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Pengecekan autentikasi dan role admin saat komponen pertama kali dimuat
  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsLoadingAuth(true)

      // 1. Ambil user yang sedang login
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        // Jika belum login, alihkan ke halaman login
        router.push('/login')
        return
      }

      // 2. Ambil role dari tabel profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        setIsAdmin(false)
        setIsLoadingAuth(false)
        return
      }

      // 3. Verifikasi apakah rolenya adalah 'admin'
      if (profile.role === 'admin') {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }

      setIsLoadingAuth(false)
    }

    checkAdminAccess()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Tampilkan loading saat sedang memverifikasi sesi dan hak akses
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sanglight bg-sangha-light">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-sangha-primary" />
          <p className="text-sm font-medium text-gray-600">Memverifikasi hak akses admin...</p>
        </div>
      </div>
    )
  }

  // Tampilkan halaman "Tidak Punya Akses" jika bukan admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sangha-light p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-sangha-cream p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-sangha-dark">Akses Ditolak</h2>
            <p className="text-gray-500 text-sm">
              Maaf, akun Anda tidak memiliki hak akses sebagai <strong>Admin</strong> untuk melihat halaman panel pengurus ini.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={() => router.push('/user')}
              className="bg-sangha-primary hover:bg-sangha-dark text-white gap-2 w-full"
            >
              <ArrowLeft size={16} />
              Kembali ke Halaman Utama
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 w-full"
            >
              Keluar Akun
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Jika lolos verifikasi (Admin), render layout admin seperti biasa
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
            onClick={() => setIsLogoutOpen(true)}
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