'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import { Plus, Ticket, MapPin, Tag, Calendar, Loader2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { getDictionary } from '@/lib/dictionary'

export default function UserTicketsPage() {
  const { lang } = useParams<{ lang: 'id' | 'en' | 'th' }>()

  const [tickets, setTickets] = useState<any[]>([])
  const [isLoadingFetch, setIsLoadingFetch] = useState(true)

  const supabase = createClient()

  const dict = getDictionary(lang)
  const t = dict.ticketsPage

  const fetchUserTickets = async () => {
    setIsLoadingFetch(true)
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const currentUserId = authData?.user?.id

    if (authError || !currentUserId) {
      toast.error(t.toastErrorAuth)
      setIsLoadingFetch(false)
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .single()

    const userRole = profileData?.role

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
      toast.error(t.toastErrorFetch, { description: error.message })
    } else if (data) {
      // Force restriction: only show tickets belonging strictly to the current user (non-admin/non-staff view)
      if (userRole === 'admin' || userRole === 'staff') {
        // Fallback filter just in case an admin accesses this specific user path
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 px-3 py-1 text-sm font-semibold">{t.status.pending}</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-900 border-blue-300 px-3 py-1 text-sm font-semibold">{t.status.in_progress}</Badge>
      case 'resolved':
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-900 border-emerald-300 px-3 py-1 text-sm font-semibold">{t.status.resolved}</Badge>
      case 'closed':
        return <Badge variant="outline" className="bg-gray-200 text-gray-800 border-gray-300 px-3 py-1 text-sm font-semibold">{t.status.closed}</Badge>
      default:
        return <Badge variant="outline" className="px-3 py-1 text-sm font-semibold">{status || t.status.pending}</Badge>
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-700 text-base sm:text-lg mt-1">{t.subtitle}</p>
          </div>
          <Link href={`/${lang}/user/create`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[52px] px-6 text-base font-bold bg-sangha-primary hover:bg-sangha-dark text-white gap-2 shadow-md">
              <Plus size={20} />
              {t.createBtn}
            </Button>
          </Link>
        </div>

        {/* Content Section */}
        {isLoadingFetch ? (
          <Card className="border-2 border-gray-300 shadow-md bg-white rounded-2xl">
            <CardContent className="p-16 text-center text-gray-700">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="animate-spin text-sangha-primary" />
                <span className="text-lg font-medium">{t.loading}</span>
              </div>
            </CardContent>
          </Card>
        ) : tickets.length === 0 ? (
          <Card className="border-2 border-gray-300 shadow-md bg-white rounded-2xl">
            <CardContent className="p-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-sangha-primary">
                <Ticket size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-xl">{t.emptyTitle}</h3>
                <p className="text-gray-700 text-base max-w-md mx-auto">{t.emptyDesc}</p>
              </div>
              <Link href={`/${lang}/user/create`} className="inline-block pt-2">
                <Button className="min-h-[52px] px-8 text-base font-bold bg-sangha-primary hover:bg-sangha-dark text-white gap-2 shadow-md">
                  <Plus size={20} />
                  {t.emptyBtn}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {tickets.map((item) => (
              <Card key={item.id} className="border-2 border-gray-300 shadow-md bg-white hover:border-sangha-primary transition-all rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  {/* Card Header Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-gray-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-md">#{item.id}</span>
                      {getStatusBadge(item.status)}
                      <div className="flex items-center gap-2 text-gray-900 font-bold text-base sm:text-lg">
                        <Tag size={18} className="text-sangha-primary shrink-0" />
                        <span>{item.category?.name || t.generalCategory}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 px-3.5 py-2 rounded-lg w-fit border border-gray-200">
                      <Calendar size={16} className="text-gray-500 shrink-0" />
                      <span>
                        {new Date(item.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'th' ? 'th-TH' : 'id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid sm:grid-cols-3 gap-4 text-base pt-1">
                    <div className="flex items-start gap-2.5 text-gray-800">
                      <MapPin size={20} className="text-sangha-primary shrink-0 mt-0.5" />
                      <div>
                        <div>
                          <strong className="text-gray-900 font-bold">
                            {t.location}:
                          </strong>{' '}
                          {item.location?.name || '-'}
                        </div>
                        {item.room_detail && (
                          <div className="text-gray-700 text-sm mt-1 bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="font-semibold">Ruang:</span> {item.room_detail}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-gray-800">
                      <strong className="text-gray-900 font-bold">{t.reporter}:</strong>{' '}
                      <span className="font-medium">{item.bhikkhu?.full_name || '-'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-800">
                      <UserCheck size={20} className="text-sangha-primary shrink-0" />
                      <span>
                        <strong className="text-gray-900 font-bold">{t.assignee}:</strong>{' '}
                        {item.assignee?.full_name ? (
                          <span className="text-sangha-primary font-bold">{item.assignee.full_name}</span>
                        ) : (
                          <span className="text-amber-700 font-medium italic">{t.unassigned}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Description Box */}
                  {item.description && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 sm:p-5 text-base text-gray-800 border-2 border-gray-200">
                      <div className="font-bold text-gray-900 mb-2">
                        {t.descriptionTitle}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}