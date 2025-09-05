import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = [
    '/employer',
    '/job-seeker',
  ]

  // Auth routes that should redirect if already authenticated
  const authRoutes = [
    '/auth/login',
    '/auth/signup',
  ]

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing auth routes while logged in, redirect to appropriate dashboard
  if (isAuthRoute && session) {
    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = (profile?.role || (session.user.user_metadata as any)?.role) as any

    if (role === 'employer') {
      return NextResponse.redirect(new URL('/employer/dashboard', req.url))
    } else if (role === 'job_seeker') {
      return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
    } else {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Role-based route protection
  if (session && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = (profile?.role || (session.user.user_metadata as any)?.role) as any

    // If role is unknown, do not bounce between dashboards
    if (role !== 'employer' && role !== 'job_seeker') {
      return response
    }

    // Check if user is accessing the correct role-based route
    if (pathname.startsWith('/employer') && role !== 'employer') {
      return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
    }
    
    if (pathname.startsWith('/job-seeker') && role !== 'job_seeker') {
      return NextResponse.redirect(new URL('/employer/dashboard', req.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}