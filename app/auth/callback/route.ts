import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

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
          } catch {}
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Ensure user record exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingUser) {
        const role = (user.user_metadata as any)?.role ?? 'job_seeker'
        const email = user.email ?? ''
        const fullName = (user.user_metadata as any)?.full_name || ''
        
        // Create user record with role
        await supabaseAdmin.from('users').insert({
          id: user.id,
          email,
          full_name: fullName,
          role,
        })

        // Create empty profile record
        await supabaseAdmin.from('profiles').insert({
          user_id: user.id,
        })
      }

      const role = (user.user_metadata as any)?.role
      if (role === 'employer') {
        return NextResponse.redirect(new URL('/employer/dashboard', request.url))
      }
      if (role === 'job_seeker') {
        return NextResponse.redirect(new URL('/job-seeker/dashboard', request.url))
      }
    }
  }

  return NextResponse.redirect(new URL('/', request.url))
}
