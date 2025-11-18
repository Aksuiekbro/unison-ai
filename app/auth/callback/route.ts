import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const type = url.searchParams.get('type')

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password/update', request.url))
      }

      // Ensure user record exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingUser) {
        const rawRole = (user.user_metadata as any)?.role ?? 'job_seeker'
        const role = (rawRole === 'employee' || rawRole === 'job-seeker') ? 'job_seeker' : rawRole
        const email = user.email ?? ''
        const fullName = (user.user_metadata as any)?.full_name || (email?.split('@')[0] || 'User')

        // Create user record with normalized role
        await supabaseAdmin.from('users').insert({
          id: user.id,
          email,
          full_name: fullName,
          role,
        })

        // Profile data now stored in users table (no separate profiles table needed)
      }

      // Determine role from DB first, then fall back to user metadata
      const { data: dbRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const rawRole = (dbRole as any)?.role ?? (user.user_metadata as any)?.role
      const normalizedRole = rawRole === 'job-seeker' || rawRole === 'employee' ? 'job_seeker' : rawRole

      if (normalizedRole === 'employer') {
        return NextResponse.redirect(new URL('/employer/dashboard', request.url))
      }
      if (normalizedRole === 'job_seeker') {
        return NextResponse.redirect(new URL('/job-seeker/dashboard', request.url))
      }
    }
  }

  return NextResponse.redirect(new URL('/', request.url))
}
