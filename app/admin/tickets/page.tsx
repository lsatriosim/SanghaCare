// app/admin/tickets/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Loader2, Ticket, MapPin, User, Tag, Calendar,
  CheckCircle2, Trash2, Languages
} from 'lucide-react'
import { toast } from 'sonner'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [isLoadingFetch, setIsLoadingFetch] = useState(true)
  const [translations, setTranslations] = useState<
    Record<
      number,
      {
        description: string
        location: string
        room_detail: string
      }
    >
  >({})

  const [translatingTicketId, setTranslatingTicketId] =
    useState<number | null>(null)

  const supabase = createClient()

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
      toast.error("Gagal memuat daftar tiket", { description: error.message })
    } else if (data) {
      setTickets(data)
    }
    setIsLoadingFetch(false)
  }

  const fetchStaffList = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')

    if (error) {
      toast.error("Gagal memuat daftar staff", { description: error.message })
      return
    }

    if (data) {
      setStaffList(data.filter((u) => u.role && u.role.toLowerCase() === 'staff'))
    }
  }

  useEffect(() => {
    fetchTickets()
    fetchStaffList()
  }, [])

  const handleAssignTicket = async (ticketId: number, staffId: string, staffName: string) => {
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_to: staffId, status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    if (error) {
      toast.error("Gagal menugaskan tiket", { description: error.message })
    } else {
      toast.success("Tiket berhasil ditugaskan", { description: `Dialihkan ke ${staffName} (In Progress)` })
      fetchTickets()
    }
  }

  const handleResolveTicket = async (ticketId: number) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'resolved', updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    if (error) {
      toast.error("Gagal memperbarui status", { description: error.message })
    } else {
      toast.success("Tiket diselesaikan", { description: "Status tiket diubah menjadi Resolved" })
      fetchTickets()
    }
  }

  const handleDeleteTicket = async (ticketId: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus tiket ini secara permanen?")) return

    const { error } = await supabase.from('tickets').delete().eq('id', ticketId)

    if (error) {
      toast.error("Gagal menghapus tiket", { description: error.message })
    } else {
      toast.success("Tiket berhasil dihapus")
      setTickets(tickets.filter((t) => t.id !== ticketId))
    }
  }

  const handleTranslate = async (ticketId: number) => {
    setTranslatingTicketId(ticketId)

    try {
      const response = await fetch('/api/translate-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.error || 'Failed to translate ticket'
        )
      }

      setTranslations((prev) => ({
        ...prev,
        [ticketId]: result.translations,
      }))

      toast.success('Tiket berhasil diterjemahkan')
    } catch (error: any) {
      console.error('Translation error:', error)

      toast.error('Gagal menerjemahkan tiket', {
        description: error?.message,
      })
    } finally {
      setTranslatingTicketId(null)
    }
  }

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
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h2 className="text-2xl font-bold text-sangha-dark">Daftar Tiket Permohonan / Kendala</h2>
          <p className="text-gray-600 text-sm">Pantau dan kelola seluruh tiket laporan atau permintaan yang masuk ke sistem.</p>
        </div>

        <Card className="border-sangha-cream shadow-xs bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-sangha-dark flex items-center gap-2">
              <Ticket size={20} className="text-sangha-primary" />
              Semua Tiket
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingFetch ? (
              <div className="p-8 flex items-center justify-center gap-2 text-gray-500">
                <Loader2
                  size={20}
                  className="animate-spin text-sangha-primary"
                />
                <span>Memuat data tiket...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Belum ada tiket yang terdaftar di dalam sistem.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tickets.map((item) => (
                  <Card
                    key={item.id}
                    className="border-gray-200 shadow-xs hover:shadow-sm transition-shadow bg-white"
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            #{item.id}
                          </span>

                          <div className="font-semibold text-sangha-dark mt-0.5">
                            {item.bhikkhu?.full_name || (
                              <span className="text-gray-400 italic">
                                Tidak ada data
                              </span>
                            )}
                          </div>

                          {item.bhikkhu?.type && (
                            <span className="text-xs text-gray-500 capitalize">
                              {item.bhikkhu.type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>

                        {getStatusBadge(item.status)}
                      </div>

                      {/* Location */}
                      {/* Location */}
                      <div className="mb-3">
                        <div className="flex items-start gap-1.5 text-sangha-dark font-medium text-sm">
                          <MapPin
                            size={14}
                            className="text-sangha-primary shrink-0 mt-0.5"
                          />

                          <div>
                            <div>
                              {item.location?.name || (
                                <span className="text-gray-400 italic">
                                  Tidak ada lokasi
                                </span>
                              )}
                            </div>

                            {item.room_detail && (
                              <div className="text-xs text-gray-500 mt-1 font-normal">
                                Ruang: {item.room_detail}

                                {translations[item.id]?.room_detail && (
                                  <div className="text-sangha-primary mt-0.5">
                                    → {translations[item.id].room_detail}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-sangha-primary bg-sangha-light px-2 py-1 rounded-md">
                          <Tag size={11} />
                          {item.category?.name || 'Umum'}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {item.description || (
                            <span className="italic text-gray-400">
                              Tanpa deskripsi
                            </span>
                          )}
                        </p>

                        {translations[item.id]?.description && (
                          <p className="text-sm text-sangha-primary mt-2 pt-2 border-t border-gray-100">
                            → {translations[item.id].description}
                          </p>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTranslate(item.id)}
                          disabled={translatingTicketId === item.id}
                          className="h-8 text-xs text-black border-black hover:bg-black-50 px-2 gap-1 mt-3 w-full"
                        >
                          {translatingTicketId === item.id ? (
                            <>
                              <Loader2
                                size={13}
                                className="animate-spin"
                              />
                              Translating...
                            </>
                          ) : (
                            <>
                              <Languages size={13} />
                              Translate
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Assignee & Date */}
                      <div className="border-t border-gray-100 pt-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700">
                            <User
                              size={13}
                              className="text-gray-400 shrink-0"
                            />

                            {item.assignee?.full_name ? (
                              <span className="font-medium">
                                {item.assignee.full_name}
                              </span>
                            ) : (
                              <span className="text-amber-600 italic">
                                Belum ditugaskan
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={12} />
                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Management Actions */}
                      <div className="border-t border-gray-100 mt-3 pt-3">
                        <select
                          className="w-full text-xs border border-gray-200 rounded px-2 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-sangha-primary mb-2"
                          value={item.assigned_to || ""}
                          onChange={(e) => {
                            const selectedStaffId = e.target.value
                            if (!selectedStaffId) return

                            const staff = staffList.find(
                              (s) => s.id === selectedStaffId
                            )

                            if (staff) {
                              handleAssignTicket(
                                item.id,
                                staff.id,
                                staff.full_name
                              )
                            }
                          }}
                        >
                          <option value="" disabled>
                            -- Assign ke Staff --
                          </option>

                          {staffList.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.full_name}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-2">
                          {item.status !== 'resolved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveTicket(item.id)}
                              className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-2 gap-1 flex-1"
                            >
                              <CheckCircle2 size={13} />
                              Selesai
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTicket(item.id)}
                            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 px-2 gap-1"
                          >
                            <Trash2 size={13} />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}