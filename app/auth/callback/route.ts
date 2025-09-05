import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  const cookieStore = cookies()
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
        await supabaseAdmin.from('profiles').insert({ id: user.id, role, email })
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
