import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import { deleteJob, updateJob } from '@/lib/actions/jobs'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const updates = await request.json()
    const result = await updateJob(params.id, updates, user.id)
    const statusCode = result.success ? 200 : 400
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const result = await deleteJob(params.id, user.id)
    const statusCode = result.success ? 200 : 400
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete job' }, { status: 500 })
  }
}


