// app/admin/tickets/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Ticket, MapPin, User, Tag, Calendar } from 'lucide-react'
import { toast } from 'sonner'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoadingFetch, setIsLoadingFetch] = useState(true)

  const supabase = createClient()

  // 1. READ: Ambil data tiket beserta relasi tabel terkait (join)
  const fetchTickets = async () => {
    setIsLoadingFetch(true)
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        bhikkhu:bhikkhu_id (full_name, type),
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
      setTickets(data)
    }
    setIsLoadingFetch(false)
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  // Helper untuk badge status tiket
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>
      case 'resolved':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Resolved</Badge>
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Closed</Badge>
      default:
        return <Badge variant="outline">{status || 'Pending'}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-sangha-dark">Daftar Tiket Permohonan / Kendala</h2>
        <p className="text-gray-600 text-sm">Pantau seluruh tiket laporan atau permintaan yang masuk ke sistem.</p>
      </div>

      <Card className="border-sangha-cream shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-sangha-dark flex items-center gap-2">
            <Ticket size={20} className="text-sangha-primary" />
            Semua Tiket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-sangha-light/50 text-sangha-dark">
                  <th className="p-3 font-semibold w-16">ID</th>
                  <th className="p-3 font-semibold">Pelapor / Bhikkhu</th>
                  <th className="p-3 font-semibold">Lokasi & Ruangan</th>
                  <th className="p-3 font-semibold">Kategori & Deskripsi</th>
                  <th className="p-3 font-semibold w-32">Status</th>
                  <th className="p-3 font-semibold w-36">Ditugaskan ke</th>
                  <th className="p-3 font-semibold w-32">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingFetch ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={20} className="animate-spin text-sangha-primary" />
                        <span>Memuat data tiket...</span>
                      </div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">
                      Belum ada tiket yang terdaftar di dalam sistem.
                    </td>
                  </tr>
                ) : (
                  tickets.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 align-top">
                      <td className="p-3 text-gray-600 font-medium">#{item.id}</td>
                      
                      {/* Bhikkhu Pelapor */}
                      <td className="p-3">
                        <div className="font-medium text-sangha-dark">
                          {item.bhikkhu?.full_name || <span className="text-gray-400 italic">Tidak ada data</span>}
                        </div>
                        {item.bhikkhu?.type && (
                          <span className="text-xs text-gray-500 capitalize">
                            {item.bhikkhu.type.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>

                      {/* Lokasi & Ruangan */}
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sangha-dark font-medium">
                          <MapPin size={13} className="text-sangha-primary shrink-0" />
                          {item.location?.name || <span className="text-gray-400 italic">-</span>}
                        </div>
                        {item.room_detail && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Ruang: {item.room_detail}
                          </div>
                        )}
                      </td>

                      {/* Kategori & Deskripsi */}
                      <td className="p-3 max-w-xs">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-sangha-primary bg-sangha-light px-2 py-0.5 rounded-md mb-1">
                          <Tag size={11} />
                          {item.category?.name || 'Umum'}
                        </div>
                        <p className="text-gray-600 text-xs line-clamp-2">
                          {item.description || <span className="italic text-gray-400">Tanpa deskripsi</span>}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Assigned To (Petugas) */}
                      <td className="p-3">
                        {item.assignee?.full_name ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                            <User size={13} className="text-gray-400 shrink-0" />
                            {item.assignee.full_name}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 italic">Belum ditugaskan</span>
                        )}
                      </td>

                      {/* Tanggal Dibuat */}
                      <td className="p-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="shrink-0" />
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}