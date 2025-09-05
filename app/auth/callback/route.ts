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
      // Ensure profile exists after email confirmation
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existing) {
        const role = (user.user_metadata as any)?.role ?? 'job_seeker'
        const email = user.email ?? ''
        const fullName = (user.user_metadata as any)?.full_name as string | undefined
        const [first, ...rest] = (fullName || '').trim().split(/\s+/)
        const firstName = first || (email ? email.split('@')[0] : '')
        const lastName = rest.join(' ') || ''
        await supabaseAdmin.from('profiles').insert({
          id: user.id,
          role,
          email,
          first_name: firstName,
          last_name: lastName,
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
