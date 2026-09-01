// app/user/create/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CreateTicketPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoadingMaster, setIsLoadingMaster] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // 1. Ambil data master & cek role pengguna untuk aturan filter bhikkhu
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingMaster(true)

      // Dapatkan user yang sedang login saat ini
      const { data: authData, error: authError } = await supabase.auth.getUser()
      const currentUserId = authData?.user?.id

      if (authError || !currentUserId) {
        toast.error("Sesi pengguna tidak valid. Silakan masuk kembali.")
        router.push('/login')
        return
      }

      // Ambil profil pengguna untuk mengecek role (admin / staff / user)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUserId)
        .single()

      const userRole = profileData?.role

      // Siapkan query bhikkhu berdasarkan role
      let bhikkhuQuery = supabase
        .from('bhikkhu_registry')
        .select('id, full_name, type, profile_id')
        .eq('isDeleted', false)
        .order('full_name')

      // Jika BUKAN admin atau staff, terapkan filter profile_id
      if (userRole !== 'admin' && userRole !== 'staff') {
        bhikkhuQuery = bhikkhuQuery.or(`profile_id.is.null,profile_id.eq.${currentUserId}`)
      }
      
      const [bhikkhuRes, locationRes, categoryRes] = await Promise.all([
        bhikkhuQuery,
        supabase.from('locations').select('id, name').order('name'),
        supabase.from('categories').select('id, name').order('name'),
      ])

      if (bhikkhuRes.data) {
        setBhikkhus(bhikkhuRes.data)
        
        // Auto-select jika hanya ada 1 bhikkhu yang terhubung langsung ke akun user ini (khusus non-admin/staff)
        const linkedBhikkhu = bhikkhuRes.data.find((b) => b.profile_id === currentUserId)
        if (linkedBhikkhu && userRole !== 'admin' && userRole !== 'staff') {
          setFormData((prev) => ({ ...prev, bhikkhu_id: String(linkedBhikkhu.id) }))
        }
      }

      if (locationRes.data) setLocations(locationRes.data)
      if (categoryRes.data) setCategories(categoryRes.data)

      if (bhikkhuRes.error || locationRes.error || categoryRes.error) {
        toast.error("Gagal memuat beberapa data pilihan master.")
      }

      setIsLoadingMaster(false)
    }

    fetchMasterData()
  }, [router, supabase])

  // Handle perubahan input form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Submit Form ke Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bhikkhu_id || !formData.location_id || !formData.category_id || !formData.description) {
      toast.error("Mohon lengkapi semua kolom yang wajib diisi.")
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.from('tickets').insert([
      {
        bhikkhu_id: Number(formData.bhikkhu_id),
        location_id: Number(formData.location_id),
        room_detail: formData.room_detail || null,
        category_id: Number(formData.category_id),
        description: formData.description,
        status: 'pending', // Default status sesuai schema
      },
    ])

    if (error) {
      toast.error("Gagal membuat tiket", {
        description: error.message,
      })
      setIsSubmitting(false)
    } else {
      toast.success("Tiket berhasil dikirim!", {
        description: "Pengurus akan segera meninjau permohonan atau laporan Anda.",
      })
      router.push('/user')
      router.refresh()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/user">
          <Button variant="outline" size="icon" className="border-sangha-cream text-sangha-dark">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-sangha-dark">Buat Tiket Baru</h2>
          <p className="text-gray-600 text-sm">Ajukan laporan kendala atau permintaan fasilitas baru.</p>
        </div>
      </div>

      <Card className="border-sangha-cream shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-sangha-dark font-semibold">Formulir Permohonan</CardTitle>
          <CardDescription className="text-gray-500">
            Isi detail informasi di bawah ini dengan lengkap dan jelas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMaster ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-gray-500">
              <Loader2 size={24} className="animate-spin text-sangha-primary" />
              <span>Memuat data pilihan...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Pilihan Bhikkhu / Pelapor */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                  Nama Bhikkhu / Pelapor <span className="text-red-500">*</span>
                </label>
                <select
                  name="bhikkhu_id"
                  value={formData.bhikkhu_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary"
                >
                  <option value="">-- Pilih Bhikkhu --</option>
                  {bhikkhus.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.full_name} {b.type ? `(${b.type.replace(/_/g, ' ')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid Lokasi & Detail Ruangan */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                    Lokasi / Gedung <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary"
                  >
                    <option value="">-- Pilih Lokasi --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                    Detail Ruangan (Opsional)
                  </label>
                  <input
                    type="text"
                    name="room_detail"
                    value={formData.room_detail}
                    onChange={handleChange}
                    placeholder="Contoh: Kamar 204, Lantai 2"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary"
                  />
                </div>
              </div>

              {/* Kategori Tiket */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                  Kategori Kendala / Permintaan <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sangha-dark uppercase tracking-wider">
                  Deskripsi Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Jelaskan kendala atau permohonan secara rinci..."
                  className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-sangha-primary resize-y"
                />
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link href="/user">
                  <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
                    Batal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sangha-primary hover:bg-sangha-dark text-white gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Kirim Tiket</span>
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