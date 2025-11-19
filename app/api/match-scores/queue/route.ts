import { NextResponse } from 'next/server'
import { enqueueMatchScoreJob } from '@/lib/services/match-score-job'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, status, companies!jobs_company_id_fkey ( owner_id )')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    const isJobOwner = job.companies?.owner_id === user.id
    const isPublished = job.status === 'published'
    let hasApplication = false

    if (!isJobOwner && !isPublished) {
      const { data: application } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .maybeSingle()

      hasApplication = Boolean(application)
    }

    if (!isJobOwner && !isPublished && !hasApplication) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    enqueueMatchScoreJob(jobId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to enqueue match score job from API:', error)
    return NextResponse.json({ success: false, error: 'Failed to enqueue AI scoring' }, { status: 500 })
  }
}
