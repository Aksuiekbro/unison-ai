import { NextResponse } from 'next/server'
import { enqueueMatchScoreJob } from '@/lib/services/match-score-job'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = await request.json().catch(() => ({ jobId: null }))
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid jobId' }, { status: 400 })
    }

    enqueueMatchScoreJob(jobId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to enqueue match score job from API:', error)
    return NextResponse.json({ success: false, error: 'Failed to enqueue AI scoring' }, { status: 500 })
  }
}
