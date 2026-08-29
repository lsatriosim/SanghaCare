// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client' // Menggunakan client yang sudah ada
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  // Inisialisasi dari folder lib/supabase/client.ts
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sangha-light px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sangha-dark">SanghaCare</h1>
          <p className="text-sangha-primary text-sm mt-1">Portal Manajemen Pengurus Acara</p>
        </div>

        <Card className="border-sangha-cream shadow-lg bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-sangha-dark">Masuk Admin</CardTitle>
            <CardDescription className="text-gray-600">
              Masukkan email dan kata sandi akun pengurus Anda.
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
                <Label htmlFor="email" className="text-sangha-dark font-medium">Email</Label>
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
                <Label htmlFor="password" className="text-sangha-dark font-medium">Kata Sandi</Label>
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
                {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
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