// app/user/create/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getDictionary, getClientLocale } from '@/lib/dictionary'

export default function CreateTicketPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoadingMaster, setIsLoadingMaster] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locale, setLocale] = useState<'id' | 'en' | 'th'>('id')

  // State pilihan Master Data
  const [bhikkhus, setBhikkhus] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  // State Form Input
  const [formData, setFormData] = useState({
    bhikkhu_id: '',
    location_id: '',
    room_detail: '',
    category_id: '',
    description: '',
  })

  // Set locale saat komponen dimuat
  useEffect(() => {
    setLocale(getClientLocale())
  }, [])

  // Ambil teks kamus terpusat
  const dict = getDictionary(locale)
  const t = dict.createTicketPage

  // 1. Ambil data master & cek role pengguna untuk aturan filter bhikkhu
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingMaster(true)

      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      const currentUserId = authData?.user?.id

      if (authError || !currentUserId) {
        toast.error(t.toastAuthError)
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUserId)
        .single()

      const userRole = profileData?.role

      let bhikkhuQuery = supabase
        .from('bhikkhu_registry')
        .select('id, full_name, type, profile_id')
        .eq('isDeleted', false)
        .order('full_name')

      if (userRole !== 'admin' && userRole !== 'staff') {
        bhikkhuQuery = bhikkhuQuery.or(
          `profile_id.is.null,profile_id.eq.${currentUserId}`
        )
      }

      const [bhikkhuRes, locationRes, categoryRes] = await Promise.all([
        bhikkhuQuery,
        supabase.from('locations').select('id, name').order('name'),
        supabase.from('categories').select('id, name').order('name'),
      ])

      if (bhikkhuRes.data) {
        setBhikkhus(bhikkhuRes.data)

        const linkedBhikkhu = bhikkhuRes.data.find(
          (b) => b.profile_id === currentUserId
        )

        if (
          linkedBhikkhu &&
          userRole !== 'admin' &&
          userRole !== 'staff'
        ) {
          setFormData((prev) => ({
            ...prev,
            bhikkhu_id: String(linkedBhikkhu.id),
          }))
        }
      }

      if (locationRes.data) {
        setLocations(locationRes.data)
      }

      if (categoryRes.data) {
        setCategories(categoryRes.data)
      }

      if (
        bhikkhuRes.error ||
        locationRes.error ||
        categoryRes.error
      ) {
        toast.error(t.toastMasterError)
      }

      setIsLoadingMaster(false)
    }

    fetchMasterData()
  }, [router, supabase, t])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.bhikkhu_id ||
      !formData.location_id ||
      !formData.category_id ||
      !formData.description
    ) {
      toast.error(t.toastFormIncomplete)
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Create the ticket first
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([
          {
            bhikkhu_id: Number(formData.bhikkhu_id),
            location_id: Number(formData.location_id),
            room_detail: formData.room_detail || null,
            category_id: Number(formData.category_id),
            description: formData.description,
            status: 'pending',
          },
        ])
        .select('id')
        .single()

      if (ticketError || !ticket) {
        throw new Error(
          ticketError?.message ?? 'Failed to create ticket'
        )
      }

      toast.success(t.toastSuccess, {
        description: t.toastSuccessDesc,
      })

      router.push('/user')
      router.refresh()
    } catch (error: any) {
      console.error('Create ticket error:', error)

      toast.error(t.toastError, {
        description:
          error?.message ?? 'Failed to create ticket',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/user">
          <Button
            variant="outline"
            size="icon"
            className="border-sangha-cream text-sangha-dark"
          >
            <ArrowLeft size={16} />
          </Button>
        </Link>

        <div>
          <h2 className="text-2xl font-bold text-sangha-dark">
            {t.title}
          </h2>
          <p className="text-gray-600 text-sm">
            {t.subtitle}
          </p>
        </div>
      </div>

      <Card className="border-sangha-cream shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-sangha-dark font-semibold">
            {t.cardTitle}
          </CardTitle>

          <CardDescription className="text-gray-500">
            {t.cardDesc}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoadingMaster ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-gray-500">
              <Loader2
                size={24}
                className="animate-spin text-sangha-primary"
              />
              <span>{t.loadingMaster}</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                  {t.bhikkhuLabel}{' '}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  name="bhikkhu_id"
                  value={formData.bhikkhu_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary"
                >
                  <option value="">
                    {t.bhikkhuPlaceholder}
                  </option>

                  {bhikkhus.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                    >
                      {b.full_name}{' '}
                      {b.type
                        ? `(${b.type.replace(/_/g, ' ')})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                    {t.locationLabel}{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary"
                  >
                    <option value="">
                      {t.locationPlaceholder}
                    </option>

                    {locations.map((loc) => (
                      <option
                        key={loc.id}
                        value={loc.id}
                      >
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                    {t.roomLabel}
                  </label>

                  <input
                    type="text"
                    name="room_detail"
                    value={formData.room_detail}
                    onChange={handleChange}
                    placeholder={t.roomPlaceholder}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                  {t.categoryLabel}{' '}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary"
                >
                  <option value="">
                    {t.categoryPlaceholder}
                  </option>

                  {categories.map((cat) => (
                    <option
                      key={cat.id}
                      value={cat.id}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                  {t.descriptionLabel}{' '}
                  <span className="text-red-500">*</span>
                </label>

                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder={t.descriptionPlaceholder}
                  className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link href="/user">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300 text-gray-700"
                  >
                    {t.cancelBtn}
                  </Button>
                </Link>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sangha-primary hover:bg-sangha-dark text-white gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      <span>{t.submittingBtn}</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{t.submitBtn}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}