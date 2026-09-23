'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, Ticket, MapPin, Tag, Calendar, Loader2, UserCheck, Languages, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { getDictionary, getClientLocale } from '@/lib/dictionary'

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoadingFetch, setIsLoadingFetch] = useState(true)
  const [locale, setLocale] = useState<'id' | 'en'>('id')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showOriginal, setShowOriginal] = useState<Set<number>>(new Set())
  const [translations, setTranslations] = useState<
    Record<
      number,
      {
        description: string
        room_detail: string
      }
    >
  >({})

  const [translatingTicketId, setTranslatingTicketId] = useState<number | null>(null)

  const supabase = createClient()

  useEffect(() => {
    setLocale(getClientLocale())
  }, [])

  const dict = getDictionary(locale)
  const t = dict.ticketsPage

  const handleTranslate = async (ticketId: number) => {
    setTranslatingTicketId(ticketId)

    try {
      const response = await fetch('/api/translate-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.error || 'Failed to translate ticket'
        )
      }

      // Store translation only in React state.
      setTranslations((prev) => ({
        ...prev,
        [ticketId]: result.translations,
      }))

      toast.success('Ticket berhasil diterjemahkan')
    } catch (error: any) {
      console.error('Translation error:', error)

      toast.error('Gagal menerjemahkan ticket', {
        description: error?.message,
      })
    } finally {
      setTranslatingTicketId(null)
    }
  }

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
    setIsAdmin(userRole === 'admin' || userRole === 'staff')

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

  const getText = (item: any, field: 'description' | 'room_detail') => {
    return item[field]
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{t.status.pending}</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t.status.in_progress}</Badge>
      case 'resolved':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{t.status.resolved}</Badge>
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">{t.status.closed}</Badge>
      default:
        return <Badge variant="outline">{status || t.status.pending}</Badge>
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-sangha-dark">{t.title}</h2>
            <p className="text-gray-600 text-sm">{t.subtitle}</p>
          </div>
          <Link href="/user/create">
            <Button className="bg-sangha-primary hover:bg-sangha-dark text-white gap-2">
              <Plus size={16} />
              {t.createBtn}
            </Button>
          </Link>
        </div>

        {isLoadingFetch ? (
          <Card className="border-sangha-cream shadow-xs bg-white">
            <CardContent className="p-12 text-center text-gray-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-sangha-primary" />
                <span>{t.loading}</span>
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
                <h3 className="font-semibold text-sangha-dark text-lg">{t.emptyTitle}</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">{t.emptyDesc}</p>
              </div>
              <Link href="/user/create">
                <Button className="bg-sangha-primary hover:bg-sangha-dark text-white gap-2 mt-2">
                  <Plus size={16} />
                  {t.emptyBtn}
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
                        <span>{item.category?.name || t.generalCategory}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-sangha-light/60 px-3 py-1.5 rounded-md w-fit">
                      <Calendar size={13} className="shrink-0" />
                      <span>
                        {new Date(item.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
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
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin
                        size={15}
                        className="text-sangha-primary shrink-0 mt-0.5"
                      />

                      <div>
                        <div>
                          <strong className="text-sangha-dark">
                            {t.location}
                          </strong>{' '}
                          {item.location?.name || '-'}
                        </div>

                        {item.room_detail && (
                          <div className="text-gray-500 text-xs mt-1">
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
                    <div className="text-gray-600">
                      <strong className="text-sangha-dark">{t.reporter}</strong> {item.bhikkhu?.full_name || '-'}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <UserCheck size={15} className="text-sangha-primary shrink-0" />
                      <span>
                        <strong className="text-sangha-dark">{t.assignee}</strong>{' '}
                        {item.assignee?.full_name ? (
                          <span className="text-sangha-primary font-medium">{item.assignee.full_name}</span>
                        ) : (
                          <span className="text-amber-600 italic">{t.unassigned}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {item.description && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sangha-dark flex items-center gap-1">
                          {t.descriptionTitle}
                        </span>
                      </div>

                      {/* Original */}
                      <p className="whitespace-pre-wrap">
                        {item.description}
                      </p>

                      {/* Translation - only exists after clicking Translate */}
                      {translations[item.id]?.description && (
                        <p className="whitespace-pre-wrap text-sangha-primary mt-2 pt-2 border-t border-gray-200">
                          → {translations[item.id].description}
                        </p>
                      )}

                      {isAdmin && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTranslate(item.id)}
                            disabled={translatingTicketId === item.id}
                            className="h-8 text-xs text-black border-black hover:bg-black-50 px-2 gap-1 flex-1"
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
                      )}
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