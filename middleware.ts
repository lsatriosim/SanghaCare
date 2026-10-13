// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const SUPPORTED_LOCALES = ['id', 'en', 'th'] as const
const DEFAULT_LOCALE = 'id'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. If it's already a clean admin route, skip locale checks and just update the session
  if (pathname.startsWith('/admin')) {
    return await updateSession(request)
  }

  // 2. Optional: Redirect any localized admin routes (e.g., /id/admin) to the clean /admin route
  for (const locale of SUPPORTED_LOCALES) {
    if (pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`)) {
      const url = request.nextUrl.clone()
      url.pathname = pathname.replace(`/${locale}`, '')
      return NextResponse.redirect(url)
    }
  }

  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )

  if (!pathnameHasLocale) {
    // No locale in the URL yet — redirect preferring the cookie or falling back to default.
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
    const locale = SUPPORTED_LOCALES.includes(cookieLocale as any)
      ? cookieLocale
      : DEFAULT_LOCALE

    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(url)
  }

  // Locale is present in the URL — proceed, refreshing the Supabase session.
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/(id|en|th)/admin/:path*',
    '/(id|en|th)/user/:path*',
  ],
}