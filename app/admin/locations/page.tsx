// app/admin/locations/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [name, setName] = useState('')
  
  // Loading States
  const [isLoadingFetch, setIsLoadingFetch] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State untuk Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<any | null>(null)
  const [editName, setEditName] = useState('')

  // State untuk Delete Modal Konfirmasi
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const supabase = createClient()

  // 1. READ: Ambil data lokasi aktif (isDeleted = false)
  const fetchLocations = async () => {
    setIsLoadingFetch(true)
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('isDeleted', false)
      .order('id', { ascending: true })

    if (error) {
      toast.error("Gagal memuat data lokasi", {
        description: error.message,
      })
    } else if (data) {
      setLocations(data)
    }
    setIsLoadingFetch(false)
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  // 2. CREATE: Tambah lokasi baru
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    const { error } = await supabase.from('locations').insert([{ name, isDeleted: false }])

    if (error) {
      toast.error("Gagal menambah lokasi", {
        description: error.message,
      })
    } else {
      toast.success("Lokasi berhasil ditambahkan")
      setName('')
      fetchLocations()
    }
    setIsCreating(false)
  }

  // 3. UPDATE: Perbarui nama lokasi
  const openEditModal = (loc: any) => {
    setEditingLocation(loc)
    setEditName(loc.name)
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editName.trim() || !editingLocation) return

    setIsUpdating(true)
    const { error } = await supabase
      .from('locations')
      .update({ name: editName })
      .eq('id', editingLocation.id)

    if (error) {
      toast.error("Gagal memperbarui lokasi", {
        description: error.message,
      })
    } else {
      toast.success("Lokasi berhasil diperbarui")
      setIsEditOpen(false)
      setEditingLocation(null)
      fetchLocations()
    }
    setIsUpdating(false)
  }

  // 4. SOFT DELETE: Arsipkan lokasi (isDeleted = true)
  const confirmDelete = (id: number) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (deletingId === null) return

    setIsDeleting(true)
    const { error } = await supabase
      .from('locations')
      .update({ isDeleted: true })
      .eq('id', deletingId)

    if (error) {
      toast.error("Gagal menghapus lokasi", {
        description: error.message,
      })
    } else {
      toast.success("Lokasi berhasil diarsipkan")
      setIsDeleteOpen(false)
      setDeletingId(null)
      fetchLocations()
    }
    setIsDeleting(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-sangha-dark">Kelola Lokasi</h2>
        <p className="text-gray-600 text-sm">Tambah, ubah, atau hapus lokasi kegiatan atau penugasan.</p>
      </div>

      {/* Form Tambah Lokasi */}
      <Card className="border-sangha-cream shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-sangha-dark">Tambah Lokasi Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4">
            <Input
              type="text"
              placeholder="Nama Lokasi (Contoh: Vihara Dhammacakka, Aula Utama)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-sangha-cream focus-visible:ring-sangha-primary flex-1"
              disabled={isCreating}
              required
            />
            <Button 
              type="submit" 
              disabled={isCreating}
              className="bg-sangha-primary hover:bg-sangha-dark text-white gap-2"
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {isCreating ? 'Menyimpan...' : 'Tambah'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabel Daftar Lokasi */}
      <Card className="border-sangha-cream shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-sangha-dark">Daftar Lokasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-sangha-light/50 text-sangha-dark">
                  <th className="p-3 font-semibold w-16">ID</th>
                  <th className="p-3 font-semibold">Nama Lokasi</th>
                  <th className="p-3 font-semibold text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingFetch ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={20} className="animate-spin text-sangha-primary" />
                        <span>Memuat data lokasi...</span>
                      </div>
                    </td>
                  </tr>
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-gray-500">
                      Belum ada lokasi yang ditambahkan.
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => (
                    <tr key={loc.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="p-3 text-gray-600">{loc.id}</td>
                      <td className="p-3 font-medium text-sangha-dark">{loc.name}</td>
                      <td className="p-3 text-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(loc)}
                          className="border-sangha-cream text-sangha-primary hover:bg-sangha-light"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(loc.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Edit Lokasi */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white border-sangha-cream">
          <DialogHeader>
            <DialogTitle className="text-sangha-dark">Edit Lokasi</DialogTitle>
            <DialogDescription className="text-gray-600">
              Ubah nama lokasi sesuai kebutuhan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border-sangha-cream focus-visible:ring-sangha-primary"
              disabled={isUpdating}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>
              Batal
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              className="bg-sangha-primary hover:bg-sangha-dark text-white gap-2"
            >
              {isUpdating && <Loader2 size={14} className="animate-spin" />}
              {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus (Soft Delete) */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white border-sangha-cream">
          <DialogHeader>
            <DialogTitle className="text-sangha-dark">Konfirmasi Hapus</DialogTitle>
            <DialogDescription className="text-gray-600">
              Apakah Anda yakin ingin menghapus lokasi ini? Data akan diarsipkan dari daftar aktif.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isDeleting && <Loader2 size={14} className="animate-spin" />}
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}