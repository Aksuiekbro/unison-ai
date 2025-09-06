import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export async function middleware(req: NextRequest) {
  const response = NextResponse.next()

  const supabase = createMiddlewareClient<Database>({ req, res: response })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Protected routes that require authentication
  // Keep public pages like job search accessible without login
  const protectedRoutes = [
    '/employer',
    '/job-seeker/dashboard',
    '/job-seeker/profile',
    '/job-seeker/settings',
    '/job-seeker/applications',
    '/job-seeker/saved',
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
    const normalizedRole = (role === 'job-seeker' || role === 'employee') ? 'job_seeker' : role

    // If role is unknown, allow access to auth pages instead of redirecting
    if (normalizedRole !== 'employer' && normalizedRole !== 'job_seeker') {
      return response
    }

    if (normalizedRole === 'employer') {
      return NextResponse.redirect(new URL('/employer/dashboard', req.url))
    }
    if (normalizedRole === 'job_seeker') {
      return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
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
    const normalizedRole = (role === 'job-seeker' || role === 'employee') ? 'job_seeker' : role

    // If role is unknown, do not bounce between dashboards
    if (normalizedRole !== 'employer' && normalizedRole !== 'job_seeker') {
      return response
    }

    // Check if user is accessing the correct role-based route
    if (pathname.startsWith('/employer') && normalizedRole !== 'employer') {
      return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
    }
    
    if (pathname.startsWith('/job-seeker') && normalizedRole !== 'job_seeker') {
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