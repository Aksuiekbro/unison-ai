import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: analysis, error: statusError } = await supabase
      .from('personality_analysis')
      .select('status, queued_at, processed_at, error_message, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (statusError) {
      console.error('Failed to fetch personality status:', statusError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: analysis?.status ?? null,
      queuedAt: analysis?.queued_at ?? null,
      processedAt: analysis?.processed_at ?? null,
      error: analysis?.error_message ?? null,
      lastUpdated: analysis?.updated_at ?? null,
      isReady: analysis?.status === 'completed'
    })
  } catch (error) {
    console.error('Personality status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load status' },
      { status: 500 }
    )
  }
}
