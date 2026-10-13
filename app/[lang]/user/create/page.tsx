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
import { getDictionary } from '@/lib/dictionary'
import { useParams } from 'next/navigation'

export default function CreateTicketPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoadingMaster, setIsLoadingMaster] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { lang } = useParams<{ lang: 'id' | 'en' | 'th' }>()

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

  const dict = getDictionary(lang)
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
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back button and page title */}
      <div className="flex items-center gap-4">
        <Link href="/user">
          <Button
            variant="outline"
            className="h-12 w-12 border-2 border-gray-400 text-gray-800 hover:bg-gray-100 rounded-lg flex items-center justify-center shrink-0"
            aria-label="Kembali"
          >
            <ArrowLeft size={24} />
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {t.title}
          </h1>
          <p className="text-gray-700 text-base sm:text-lg mt-1">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="border-2 border-gray-300 shadow-md bg-white rounded-xl">
        <CardHeader className="p-6 border-b border-gray-200 bg-gray-50/50">
          <CardTitle className="text-xl sm:text-2xl text-sangha-dark font-bold">
            {t.cardTitle}
          </CardTitle>

          <CardDescription className="text-gray-700 text-base mt-1">
            {t.cardDesc}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {isLoadingMaster ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3 text-gray-700">
              <Loader2
                size={36}
                className="animate-spin text-sangha-primary"
              />
              <span className="text-lg font-medium">{t.loadingMaster}</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* 1. Nama Bhikkhu */}
              <div className="space-y-2">
                <label className="block text-lg font-bold text-gray-900">
                  {t.bhikkhuLabel}{' '}
                  <span className="text-red-600 font-bold">*</span>
                </label>

                <select
                  name="bhikkhu_id"
                  value={formData.bhikkhu_id}
                  onChange={handleChange}
                  required
                  className="w-full min-h-[52px] rounded-lg border-2 border-gray-400 bg-white px-4 py-3 text-base sm:text-lg text-gray-900 focus:outline-none focus:ring-4 focus:ring-amber-500/30 focus:border-sangha-primary"
                >
                  <option value="">
                    -- {t.bhikkhuPlaceholder} --
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

              {/* 2. Lokasi & Detail Ruangan */}
              <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-lg font-bold text-gray-900">
                    {t.locationLabel}{' '}
                    <span className="text-red-600 font-bold">*</span>
                  </label>

                  <select
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleChange}
                    required
                    className="w-full min-h-[52px] rounded-lg border-2 border-gray-400 bg-white px-4 py-3 text-base sm:text-lg text-gray-900 focus:outline-none focus:ring-4 focus:ring-amber-500/30 focus:border-sangha-primary"
                  >
                    <option value="">
                      -- {t.locationPlaceholder} --
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

                <div className="space-y-2">
                  <label className="block text-lg font-bold text-gray-900">
                    {t.roomLabel}{' '}
                    <span className="text-gray-500 font-normal text-base">(Opsional)</span>
                  </label>

                  <input
                    type="text"
                    name="room_detail"
                    value={formData.room_detail}
                    onChange={handleChange}
                    placeholder={t.roomPlaceholder}
                    className="w-full min-h-[52px] rounded-lg border-2 border-gray-400 bg-white px-4 py-3 text-base sm:text-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-amber-500/30 focus:border-sangha-primary"
                  />
                </div>
              </div>

              {/* 3. Kategori */}
              <div className="space-y-2">
                <label className="block text-lg font-bold text-gray-900">
                  {t.categoryLabel}{' '}
                  <span className="text-red-600 font-bold">*</span>
                </label>

                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="w-full min-h-[52px] rounded-lg border-2 border-gray-400 bg-white px-4 py-3 text-base sm:text-lg text-gray-900 focus:outline-none focus:ring-4 focus:ring-amber-500/30 focus:border-sangha-primary"
                >
                  <option value="">
                    -- {t.categoryPlaceholder} --
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

              {/* 4. Deskripsi / Detail Bantuan */}
              <div className="space-y-2">
                <label className="block text-lg font-bold text-gray-900">
                  {t.descriptionLabel}{' '}
                  <span className="text-red-600 font-bold">*</span>
                </label>

                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder={t.descriptionPlaceholder}
                  className="w-full rounded-lg border-2 border-gray-400 bg-white p-4 text-base sm:text-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-amber-500/30 focus:border-sangha-primary resize-y"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <Link href="/user" className="w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-6 text-base font-bold border-2 border-gray-400 text-gray-800 hover:bg-gray-100"
                  >
                    {t.cancelBtn}
                  </Button>
                </Link>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-12 px-8 text-base font-bold bg-sangha-primary hover:bg-sangha-dark text-white gap-2 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={20}
                        className="animate-spin"
                      />
                      <span>{t.submittingBtn}</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
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