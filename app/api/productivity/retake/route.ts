import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ productivity_assessment_completed: false })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to reset status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (_) {
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}


