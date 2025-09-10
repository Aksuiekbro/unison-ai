import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import { createJob, getJobs } from '@/lib/actions/jobs'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const status = url.searchParams.get('status') as any | null
    const job_type = url.searchParams.get('job_type') as any | null
    const search = url.searchParams.get('search') || undefined

    const filters: any = {}
    if (status) filters.status = status
    if (job_type) filters.job_type = job_type
    if (search) filters.search = search

    const result = await getJobs(user.id, filters)
    const statusCode = result.success ? 200 : 400
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await createJob(body, user.id)
    const statusCode = result.success ? 200 : 400
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create job' }, { status: 500 })
  }
}


