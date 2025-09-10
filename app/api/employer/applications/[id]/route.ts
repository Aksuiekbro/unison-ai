import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import { updateApplicationStatus } from '@/lib/actions/jobs'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { status, notes } = body || {}
    if (!status) {
      return NextResponse.json({ success: false, error: 'Missing status' }, { status: 400 })
    }

    const result = await updateApplicationStatus(params.id, status, user.id, notes)
    const statusCode = result.success ? 200 : 400
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 })
  }
}


