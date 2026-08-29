// app/admin/page.tsx
export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-sangha-cream shadow-xs">
        <h2 className="text-xl font-bold text-sangha-dark mb-2">Selamat Datang di SanghaCare</h2>
        <p className="text-gray-600 text-sm">
          Ini adalah halaman dashboard utama pengurus. Sistem pemantauan tiket permintaan bantuan dari para bhikkhu akan muncul di sini secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-sangha-cream shadow-xs">
          <p className="text-sm text-gray-500 font-medium">Total Permintaan (Pending)</p>
          <h3 className="text-3xl font-bold text-sangha-primary mt-2">0</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-sangha-cream shadow-xs">
          <p className="text-sm text-gray-500 font-medium">Sedang Diproses (In Progress)</p>
          <h3 className="text-3xl font-bold text-sangha-accent mt-2">0</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-sangha-cream shadow-xs">
          <p className="text-sm text-gray-500 font-medium">Selesai (Resolved)</p>
          <h3 className="text-3xl font-bold text-green-700 mt-2">0</h3>
        </div>
      </div>
    </div>
  )
}