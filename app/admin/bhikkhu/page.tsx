// app/admin/bhikkhu/page.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function BhikkhuPage() {
  const [bhikkhus, setBhikkhus] = useState<any[]>([])
  const [fullName, setFullName] = useState('')
  const [type, setType] = useState('')
  
  // Loading States
  const [isLoadingFetch, setIsLoadingFetch] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State untuk Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingBhikkhu, setEditingBhikkhu] = useState<any | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editType, setEditType] = useState('')

  // State untuk Delete Modal Konfirmasi
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const supabase = createClient()

  const formatBhikkhuType = (typeValue: string) => {
    switch (typeValue) {
      case 'bhikkhu_sti': return 'Bhikkhu STI'
      case 'bhikkhu_non_sti': return 'Bhikkhu Non STI'
      case 'atthasilani_astinda': return 'Atthasilani Astinda'
      case 'atthasilani_non_astinda': return 'Atthasilani Non Astinda'
      default: return typeValue
    }
  }

  // 1. READ: Ambil data bhikkhu yang aktif (isDeleted = false)
  const fetchBhikkhus = async () => {
    setIsLoadingFetch(true)
    const { data, error } = await supabase
      .from('bhikkhu_registry')
      .select('*')
      .eq('isDeleted', false)
      .order('id', { ascending: true })

    if (error) {
      toast.error("Gagal memuat data bhikkhu", {
        description: error.message,
      })
    } else if (data) {
      setBhikkhus(data)
    }
    setIsLoadingFetch(false)
  }

  useEffect(() => {
    fetchBhikkhus()
  }, [])

  // 2. CREATE: Tambah bhikkhu baru
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !type) {
      toast.error("Form belum lengkap", { description: "Mohon isi nama dan tipe bhikkhu." })
      return
    }

    setIsCreating(true)
    const { error } = await supabase.from('bhikkhu_registry').insert([{ 
      full_name: fullName, 
      type, 
      isDeleted: false 
    }])

    if (error) {
      toast.error("Gagal menambah data bhikkhu", {
        description: error.message,
      })
    } else {
      toast.success("Data bhikkhu berhasil ditambahkan")
      setFullName('')
      setType('')
      fetchBhikkhus()
    }
    setIsCreating(false)
  }

  // 3. UPDATE: Perbarui data bhikkhu
  const openEditModal = (item: any) => {
    setEditingBhikkhu(item)
    setEditFullName(item.full_name)
    setEditType(item.type)
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editFullName.trim() || !editType || !editingBhikkhu) return

    setIsUpdating(true)
    const { error } = await supabase
      .from('bhikkhu_registry')
      .update({ full_name: editFullName, type: editType })
      .eq('id', editingBhikkhu.id)

    if (error) {
      toast.error("Gagal memperbarui data bhikkhu", {
        description: error.message,
      })
    } else {
      toast.success("Data bhikkhu berhasil diperbarui")
      setIsEditOpen(false)
      setEditingBhikkhu(null)
      fetchBhikkhus()
    }
    setIsUpdating(false)
  }

  // 4. SOFT DELETE: Arsipkan data bhikkhu (isDeleted = true)
  const confirmDelete = (id: number) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (deletingId === null) return

    setIsDeleting(true)
    const { error } = await supabase
      .from('bhikkhu_registry')
      .update({ isDeleted: true })
      .eq('id', deletingId)

    if (error) {
      toast.error("Gagal menghapus data bhikkhu", {
        description: error.message,
      })
    } else {
      toast.success("Data bhikkhu berhasil diarsipkan")
      setIsDeleteOpen(false)
      setDeletingId(null)
      fetchBhikkhus()
    }
    setIsDeleting(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-sangha-dark">Kelola Data Bhikkhu</h2>
        <p className="text-gray-600 text-sm">Tambah, ubah, atau hapus data registrasi bhikkhu.</p>
      </div>

      {/* Form Tambah Bhikkhu */}
      <Card className="border-sangha-cream shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-sangha-dark">Tambah Bhikkhu Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Nama Lengkap & Gelar (Contoh: Bhante Dhammika)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border-sangha-cream focus-visible:ring-sangha-primary flex-1"
              disabled={isCreating}
              required
            />
            <div className="w-full sm:w-56">
                <Select 
                    value={type} 
                    onValueChange={(val) => setType(val ?? '')} 
                    disabled={isCreating}
                >
                    <SelectTrigger className="border-sangha-cream">
                        <SelectValue placeholder="Pilih Tipe" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="bhikkhu_sti">Bhikkhu STI</SelectItem>
                        <SelectItem value="bhikkhu_non_sti">Bhikkhu Non STI</SelectItem>
                        <SelectItem value="atthasilani_astinda">Atthasilani Astinda</SelectItem>
                        <SelectItem value="atthasilani_non_astinda">Atthasilani Non Astinda</SelectItem>
                    </SelectContent>
                </Select>
            </div>
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

      {/* Tabel Daftar Bhikkhu */}
      <Card className="border-sangha-cream shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-sangha-dark">Daftar Bhikkhu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-sangha-light/50 text-sangha-dark">
                  <th className="p-3 font-semibold w-16">ID</th>
                  <th className="p-3 font-semibold">Nama & Gelar</th>
                  <th className="p-3 font-semibold w-48">Tipe</th>
                  <th className="p-3 font-semibold text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingFetch ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={20} className="animate-spin text-sangha-primary" />
                        <span>Memuat data bhikkhu...</span>
                      </div>
                    </td>
                  </tr>
                ) : bhikkhus.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      Belum ada data bhikkhu yang ditambahkan.
                    </td>
                  </tr>
                ) : (
                  bhikkhus.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="p-3 text-gray-600">{item.id}</td>
                      <td className="p-3 font-medium text-sangha-dark">{item.full_name}</td>
                      <td className="p-3">
                        <span className="inline-block px-2.5 py-1 text-xs font-medium bg-sangha-light text-sangha-dark rounded-full">
                            {formatBhikkhuType(item.type)}
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="border-sangha-cream text-sangha-primary hover:bg-sangha-light"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(item.id)}
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

      {/* Modal Edit Bhikkhu */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white border-sangha-cream">
          <DialogHeader>
            <DialogTitle className="text-sangha-dark">Edit Data Bhikkhu</DialogTitle>
            <DialogDescription className="text-gray-600">
              Ubah informasi nama atau tipe bhikkhu sesuai kebutuhan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nama Lengkap & Gelar</label>
              <Input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="border-sangha-cream focus-visible:ring-sangha-primary"
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Tipe</label>
              <Select 
                value={editType} 
                onValueChange={(val) => setEditType(val ?? '')} 
                disabled={isUpdating}
              >
                <SelectTrigger className="border-sangha-cream">
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="bhikkhu_sti">Bhikkhu STI</SelectItem>
                  <SelectItem value="bhikkhu_non_sti">Bhikkhu Non STI</SelectItem>
                  <SelectItem value="atthasilani_astinda">Atthasilani Astinda</SelectItem>
                  <SelectItem value="atthasilani_non_astinda">Atthasilani Non Astinda</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              Apakah Anda yakin ingin menghapus data bhikkhu ini? Data akan diarsipkan dari daftar aktif.
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