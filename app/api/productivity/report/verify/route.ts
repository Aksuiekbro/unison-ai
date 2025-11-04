import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function sign(assessmentId: string, completedAt: string | null, secret: string) {
  const payload = `${assessmentId}.${completedAt ?? ''}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const assessmentId = searchParams.get('assessmentId')
    const sig = searchParams.get('sig')
    if (!assessmentId || !sig) {
      return NextResponse.json({ valid: false, error: 'Missing params' }, { status: 400 })
    }

    const { data: assessment } = await supabaseAdmin
      .from('productivity_assessments')
      .select('id, completed_at, created_at')
      .eq('id', assessmentId)
      .maybeSingle()

    if (!assessment) {
      return NextResponse.json({ valid: false, error: 'Not found' }, { status: 404 })
    }

    const secret = process.env.REPORT_SIGNING_SECRET || 'dev-secret'
    const expected = sign(assessment.id, assessment.completed_at ?? assessment.created_at ?? null, secret)
    const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))

    return NextResponse.json({ valid })
  } catch (e) {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}


