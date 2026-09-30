import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Check for a Bearer token from mobile clients (Flutter)
  const authHeader = request.headers.get('authorization')
  let isAuthenticated = false

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    // Validate the token directly with Supabase
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) isAuthenticated = true
  } else {
    // 2. Fallback to standard cookie claims for web clients
    const { data } = await supabase.auth.getClaims()
    if (data?.claims) isAuthenticated = true
  }

  // 3. Handle unauthenticated requests
  if (!isAuthenticated) {
    const path = request.nextUrl.pathname

    // If it's an API route (like /api/translate-ticket), return a clean 401 JSON response instead of a redirect
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For web page routes, redirect to login
    if (!path.startsWith('/login') && !path.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}