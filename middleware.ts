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
  // Wrap in try-catch to handle transient network failures gracefully
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    // Log the error but don't block the request - treat as unauthenticated
    console.warn('Middleware auth check failed (network issue):', error)
  }

  // Pass user ID to server components via header to avoid re-authentication
  if (user) {
    response.headers.set('x-user-id', user.id)
    const role = (user.user_metadata as any)?.role
    if (role) {
      response.headers.set('x-user-role', role)
    }
  }

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
    '/job-seeker/search',
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

  // Helper to normalize role
  const normalizeRole = (role: string | null | undefined) => {
    if (role === 'job-seeker' || role === 'employee') return 'job_seeker'
    return role
  }

  // If accessing auth routes while logged in, redirect to appropriate dashboard
  if (isAuthRoute && user) {
    // Use metadata role directly - fast path without DB query
    const metadataRole = normalizeRole((user.user_metadata as any)?.role)
    
    if (metadataRole === 'employer') {
      return NextResponse.redirect(new URL('/employer/dashboard', req.url))
    } else if (metadataRole === 'job_seeker') {
      return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
    }
    
    // Only query DB if metadata doesn't have role
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = normalizeRole(userData?.role)

      if (role === 'employer') {
        return NextResponse.redirect(new URL('/employer/dashboard', req.url))
      } else if (role === 'job_seeker') {
        return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch (error) {
      console.warn('Middleware database query failed:', error)
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Role-based route protection
  if (user && isProtectedRoute) {
    // Fast path: check metadata role first
    const metadataRole = normalizeRole((user.user_metadata as any)?.role)
    
    // Quick role mismatch check without DB query
    if (metadataRole) {
      if (pathname.startsWith('/employer') && metadataRole !== 'employer') {
        return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
      }
      if (pathname.startsWith('/job-seeker') && metadataRole !== 'job_seeker') {
        return NextResponse.redirect(new URL('/employer/dashboard', req.url))
      }
    }

    // For job-seekers accessing job-seeker routes, check assessment status
    // Only query DB when absolutely necessary
    const needsAssessmentCheck = metadataRole === 'job_seeker' && pathname.startsWith('/job-seeker')
    const isTestPage = pathname === '/job-seeker/test'
    const isResultsPage = pathname === '/job-seeker/results'
    
    if (needsAssessmentCheck && !isResultsPage) {
      try {
        // Single combined query for user data + assessment status
        const [userDataResult, analysisResult] = await Promise.all([
          supabase
            .from('users')
            .select('role, personality_assessment_completed, productivity_assessment_completed')
            .eq('id', user.id)
            .single(),
          // Only query analysis if we might need it (not on test page already)
          isTestPage 
            ? Promise.resolve({ data: null })
            : supabase
                .from('personality_analysis')
                .select('status')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()
        ])

        const userData = userDataResult.data
        const role = normalizeRole(userData?.role || metadataRole)

        // Verify role from DB if metadata was wrong
        if (role !== 'employer' && role !== 'job_seeker') {
          return response
        }

        if (pathname.startsWith('/employer') && role !== 'employer') {
          return NextResponse.redirect(new URL('/job-seeker/dashboard', req.url))
        }

        if (pathname.startsWith('/job-seeker') && role !== 'job_seeker') {
          return NextResponse.redirect(new URL('/employer/dashboard', req.url))
        }

        // Assessment check for job seekers
        if (role === 'job_seeker') {
          const assessmentCompleted = (userData?.personality_assessment_completed !== null && userData?.personality_assessment_completed !== undefined)
            ? userData.personality_assessment_completed
            : (userData as any)?.productivity_assessment_completed || false

          const assessmentInProgress = analysisResult.data?.status === 'queued' || analysisResult.data?.status === 'processing'

          // If assessment not completed and not on test page, redirect to test
          if (!assessmentCompleted && !assessmentInProgress && !isTestPage && !isResultsPage) {
            return NextResponse.redirect(new URL('/job-seeker/test', req.url))
          }

          // If assessment completed and trying to access test page, redirect to results
          if ((assessmentCompleted || assessmentInProgress) && isTestPage) {
            return NextResponse.redirect(new URL('/job-seeker/results', req.url))
          }
        }
      } catch (error) {
        console.warn('Middleware role protection query failed:', error)
        // Fall through and allow access if DB query fails
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
