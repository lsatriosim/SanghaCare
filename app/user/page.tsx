// app/user/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Ticket, MapPin, Tag, Calendar, Loader2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoadingFetch, setIsLoadingFetch] = useState(true)

  const supabase = createClient()

  // Ambil daftar tiket beserta relasi tabel terkait (termasuk assignee untuk staff)
  const fetchUserTickets = async () => {
    setIsLoadingFetch(true)

    // 1. Dapatkan user yang sedang login saat ini
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const currentUserId = authData?.user?.id

    if (authError || !currentUserId) {
      toast.error("Sesi pengguna tidak valid. Silakan masuk kembali.")
      setIsLoadingFetch(false)
      return
    }

    // 2. Ambil role pengguna dari tabel profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .single()

    const userRole = profileData?.role

    // 3. Ambil data tiket dari Supabase (Ditambahkan relasi assignee:assigned_to)
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        bhikkhu:bhikkhu_id (full_name, type, profile_id),
        location:location_id (name),
        category:category_id (name),
        assignee:assigned_to (full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Gagal memuat daftar tiket", {
        description: error.message,
      })
    } else if (data) {
      // 4. Filter tiket: Jika admin atau staff, tampilkan semua. Jika bukan, filter berdasarkan profile_id bhikkhu
      if (userRole === 'admin' || userRole === 'staff') {
        setTickets(data)
      } else {
        const filteredTickets = data.filter(
          (ticket) => ticket.bhikkhu && ticket.bhikkhu.profile_id === currentUserId
        )
        setTickets(filteredTickets)
      }
    }
    setIsLoadingFetch(false)
  }

  useEffect(() => {
    fetchUserTickets()
  }, [])

  // Helper untuk badge status tiket
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sedang Diproses</Badge>
      case 'resolved':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Selesai</Badge>
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Ditutup</Badge>
      default:
        return <Badge variant="outline">{status || 'Pending'}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-sangha-dark">Tiket Saya</h2>
          <p className="text-gray-600 text-sm">Daftar permohonan atau laporan kendala yang telah diajukan.</p>
        </div>
        <Link href="/user/create">
          <Button className="bg-sangha-primary hover:bg-sangha-dark text-white gap-2">
            <Plus size={16} />
            Buat Tiket Baru
          </Button>
        </Link>
      </div>

      {isLoadingFetch ? (
        <Card className="border-sangha-cream shadow-xs bg-white">
          <CardContent className="p-12 text-center text-gray-500">
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-sangha-primary" />
              <span>Memuat tiket Anda...</span>
            </div>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="border-sangha-cream shadow-xs bg-white">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-sangha-light flex items-center justify-center mx-auto text-sangha-primary">
              <Ticket size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sangha-dark text-lg">Belum Ada Tiket</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Anda belum pernah membuat permohonan atau laporan kendala. Silakan buat tiket baru jika memerlukan bantuan.
              </p>
            </div>
            <Link href="/user/create">
              <Button className="bg-sangha-primary hover:bg-sangha-dark text-white gap-2 mt-2">
                <Plus size={16} />
                Buat Tiket Sekarang
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((item) => (
            <Card key={item.id} className="border-sangha-cream shadow-xs bg-white hover:border-sangha-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">#{item.id}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sangha-dark font-medium">
                      <Tag size={15} className="text-sangha-primary shrink-0" />
                      <span>{item.category?.name || 'Kategori Umum'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-sangha-light/60 px-3 py-1.5 rounded-md w-fit">
                    <Calendar size={13} className="shrink-0" />
                    <span>
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={15} className="text-sangha-primary shrink-0" />
                    <span>
                      <strong className="text-sangha-dark">Lokasi:</strong> {item.location?.name || '-'} 
                      {item.room_detail && <span className="text-gray-500"> ({item.room_detail})</span>}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    <strong className="text-sangha-dark">Pelapor:</strong> {item.bhikkhu?.full_name || '-'}
                  </div>
                  
                  {/* Menampilkan Nama Staff yang Di-assign */}
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <UserCheck size={15} className="text-sangha-primary shrink-0" />
                    <span>
                      <strong className="text-sangha-dark">Petugas:</strong>{' '}
                      {item.assignee?.full_name ? (
                        <span className="text-sangha-primary font-medium">{item.assignee.full_name}</span>
                      ) : (
                        <span className="text-amber-600 italic">Belum ditugaskan</span>
                      )}
                    </span>
                  </div>
                </div>

                {item.description && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100">
                    <span className="font-semibold text-sangha-dark block mb-1">Deskripsi Kendala / Permintaan:</span>
                    <p className="whitespace-pre-wrap">{item.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}