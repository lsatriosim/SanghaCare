// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Fungsi helper dari lib/supabase/middleware.ts akan memperbarui sesi
  return await updateSession(request)
}

export const config = {
  matcher: ['/admin/:path*'],
}