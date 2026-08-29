// app/admin/categories/page.tsx
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [name, setName] = useState('')
  
  // Loading States
  const [isLoadingFetch, setIsLoadingFetch] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State untuk Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [editName, setEditName] = useState('')

  // State untuk Delete Modal Konfirmasi
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const supabase = createClient()

  // 1. READ: Ambil data kategori yang aktif (isDeleted = false)
  const fetchCategories = async () => {
    setIsLoadingFetch(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('isDeleted', false) // Hanya ambil yang belum dihapus
      .order('id', { ascending: true })

    if (error) {
      toast.error("Gagal memuat data kategori", {
        description: error.message,
      })
    } else if (data) {
      setCategories(data)
    }
    setIsLoadingFetch(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 2. CREATE: Tambah kategori baru
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    const { error } = await supabase.from('categories').insert([{ name, isDeleted: false }])

    if (error) {
      toast.error("Gagal menambah kategori", {
        description: error.message,
      })
    } else {
      toast.success("Kategori berhasil ditambahkan")
      setName('')
      fetchCategories()
    }
    setIsCreating(false)
  }

  // 3. UPDATE: Perbarui nama kategori
  const openEditModal = (cat: any) => {
    setEditingCategory(cat)
    setEditName(cat.name)
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editName.trim() || !editingCategory) return

    setIsUpdating(true)
    const { error } = await supabase
      .from('categories')
      .update({ name: editName })
      .eq('id', editingCategory.id)

    if (error) {
      toast.error("Gagal memperbarui kategori", {
        description: error.message,
      })
    } else {
      toast.success("Kategori berhasil diperbarui")
      setIsEditOpen(false)
      setEditingCategory(null)
      fetchCategories()
    }
    setIsUpdating(false)
  }

  // 4. SOFT DELETE: Mengubah status isDeleted menjadi true
  const confirmDelete = (id: number) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (deletingId === null) return

    setIsDeleting(true)
    // Alih-alih .delete(), kita gunakan .update({ isDeleted: true })
    const { error } = await supabase
      .from('categories')
      .update({ isDeleted: true })
      .eq('id', deletingId)

    if (error) {
      toast.error("Gagal menghapus kategori", {
        description: error.message,
      })
    } else {
      toast.success("Kategori berhasil diarsipkan (dihapus)")
      setIsDeleteOpen(false)
      setDeletingId(null)
      fetchCategories()
    }
    setIsDeleting(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-sangha-dark">Kelola Kategori Tiket</h2>
        <p className="text-gray-600 text-sm">Tambah, ubah, atau hapus jenis kategori permintaan bantuan.</p>
      </div>

      {/* Form Tambah Kategori */}
      <Card className="border-sangha-cream shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-sangha-dark">Tambah Kategori Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4">
            <Input
              type="text"
              placeholder="Nama Kategori (Contoh: Obat-obatan, Akomodasi)"
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

      {/* Tabel Daftar Kategori */}
      <Card className="border-sangha-cream shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-sangha-dark">Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-sangha-light/50 text-sangha-dark">
                  <th className="p-3 font-semibold w-16">ID</th>
                  <th className="p-3 font-semibold">Nama Kategori</th>
                  <th className="p-3 font-semibold text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingFetch ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={20} className="animate-spin text-sangha-primary" />
                        <span>Memuat data kategori...</span>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-gray-500">
                      Belum ada kategori yang ditambahkan.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="p-3 text-gray-600">{cat.id}</td>
                      <td className="p-3 font-medium text-sangha-dark">{cat.name}</td>
                      <td className="p-3 text-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(cat)}
                          className="border-sangha-cream text-sangha-primary hover:bg-sangha-light"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(cat.id)}
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

      {/* Modal Edit Kategori */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white border-sangha-cream">
          <DialogHeader>
            <DialogTitle className="text-sangha-dark">Edit Kategori</DialogTitle>
            <DialogDescription className="text-gray-600">
              Ubah nama kategori sesuai kebutuhan.
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
              Apakah Anda yakin ingin menghapus kategori ini? Data akan diarsipkan dari daftar aktif.
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