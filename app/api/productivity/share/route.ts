import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: assessment, error: aErr } = await supabase
      .from('productivity_assessments')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (aErr || !assessment) {
      return NextResponse.json({ success: false, error: 'No assessment' }, { status: 400 })
    }

    const token = crypto.randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertErr } = await supabase
      .from('shared_reports')
      .insert({ user_id: user.id, assessment_id: assessment.id, token, expires_at: expiresAt })

    if (insertErr) {
      return NextResponse.json({ success: false, error: 'Failed to create share link' }, { status: 500 })
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
    const url = `${origin}/share/${token}`
    return NextResponse.json({ success: true, url })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}


