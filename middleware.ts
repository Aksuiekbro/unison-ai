import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export async function middleware(req: NextRequest) {
  const response = NextResponse.next()

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
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Validate user via access token; refresh if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  // If trying to access protected route without authenticated user, redirect to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing auth routes while logged in, redirect to appropriate dashboard
  if (isAuthRoute && user) {
    try {
      // Get user data to determine role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = (userData?.role || (user.user_metadata as any)?.role) as any
      const normalizedRole = role === 'job-seeker' ? 'job_seeker' : role

      if (normalizedRole === 'employer') {
        return NextResponse.redirect(new URL('/employer/dashboard', req.url))
      } else if (normalizedRole === 'job_seeker') {
        return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch (error) {
      // If database query fails, fall back to user metadata or allow auth page
      console.warn('Middleware database query failed:', error)
      const role = (user?.user_metadata as any)?.role
      const normalizedRole = role === 'job-seeker' ? 'job_seeker' : role
      
      if (normalizedRole === 'employer') {
        return NextResponse.redirect(new URL('/employer/dashboard', req.url))
      } else if (normalizedRole === 'job_seeker') {
        return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
      }
      // If no role found, allow access to auth page
    }
  }

  // Role-based route protection
  if (user && isProtectedRoute) {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role, productivity_assessment_completed')
        .eq('id', user.id)
        .single()

      const role = (userData?.role || (user.user_metadata as any)?.role) as any
      const normalizedRole = role === 'job-seeker' ? 'job_seeker' : role

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

      // Mandatory productivity assessment for job seekers
      if (normalizedRole === 'job_seeker') {
        const assessmentCompleted = userData?.productivity_assessment_completed || false
        const isTestPage = pathname === '/job-seeker/test'
        const isResultsPage = pathname === '/job-seeker/results'

        // If assessment not completed and not on test page, redirect to test
        if (!assessmentCompleted && !isTestPage && !isResultsPage) {
          return NextResponse.redirect(new URL('/job-seeker/test', req.url))
        }

        // If assessment completed and trying to access test page, redirect to results
        if (assessmentCompleted && isTestPage) {
          return NextResponse.redirect(new URL('/job-seeker/results', req.url))
        }
      }
    } catch (error) {
      // If database query fails, fall back to user metadata
      console.warn('Middleware role protection query failed:', error)
      const role = (user?.user_metadata as any)?.role
      const normalizedRole = role === 'job-seeker' ? 'job_seeker' : role

      if (normalizedRole !== 'employer' && normalizedRole !== 'job_seeker') {
        return response
      }

      if (pathname.startsWith('/employer') && normalizedRole !== 'employer') {
        return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
      }

      if (pathname.startsWith('/job-seeker') && normalizedRole !== 'job_seeker') {
        return NextResponse.redirect(new URL('/employer/dashboard', req.url))
      }
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
