// app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getDictionary, getClientLocale } from '@/lib/dictionary'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // State untuk melacak bahasa aktif
  const [locale, setLocale] = useState<'id' | 'en' | 'th'>('id')
  
  const router = useRouter()
  const supabase = createClient()

  // Ambil preferensi bahasa dari helper terpusat saat komponen dimuat
  useEffect(() => {
    setLocale(getClientLocale())
  }, [])

  // Ambil teks kamus terpusat khusus halaman login
  const dict = getDictionary(locale)
  const t = dict.loginPage

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    // 1. Proses autentikasi masuk
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setErrorMsg(authError.message)
      setLoading(false)
      return
    }

    const user = authData.user

    if (user) {
      // 2. Ambil role pengguna dari tabel profiles berdasarkan user.id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setErrorMsg(t.errorProfile)
        setLoading(false)
        return
      }

      // 3. Logika pengalihan (Redirection) berdasarkan role
      if (profileData?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/user')
      }
      
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sangha-light px-4 relative">
      
      {/* Tombol Pengganti Bahasa di Pojok Kanan Atas */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher currentLocale={locale} />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sangha-dark">SanghaCare</h1>
          <p className="text-sangha-primary text-sm mt-1">{t.subtitle}</p>
        </div>

        <Card className="border-sangha-cream shadow-lg bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-sangha-dark">{t.title}</CardTitle>
            <CardDescription className="text-gray-600">
              {t.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md border border-red-200">
                  {errorMsg}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sangha-dark font-medium">{t.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-sangha-cream focus-visible:ring-sangha-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sangha-dark font-medium">{t.passwordLabel}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-sangha-cream focus-visible:ring-sangha-primary"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-sangha-primary hover:bg-sangha-dark text-white transition-colors py-2"
                disabled={loading}
              >
                {loading ? t.loadingButton : t.submitButton}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-xs text-sangha-primary opacity-80">
          &copy; {new Date().getFullYear()} SanghaCare. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </div>
  )
}