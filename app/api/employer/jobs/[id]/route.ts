import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'
import { deleteJob, updateJob } from '@/lib/actions/jobs'

type ParamsPromise = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: ParamsPromise) {
  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const updates = await request.json()
    const result = await updateJob(id, updates, user.id)
    const statusCode = result.success ? 200 : 400
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: ParamsPromise) {
  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const result = await deleteJob(id, user.id)
    const statusCode = result.success ? 200 : 400
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete job' }, { status: 500 })
  }
}

