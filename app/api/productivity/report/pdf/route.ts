import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export const runtime = 'nodejs'

function signAssessment(assessmentId: string, completedAt: string | null, secret: string) {
  const payload = `${assessmentId}.${completedAt ?? ''}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch latest completed productivity assessment and related info
    const [assessmentRes, workExpRes, knowledgeRes, userRes] = await Promise.all([
      supabase
        .from('productivity_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('work_experiences')
        .select('company_name, position, start_date, end_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('knowledge_assessments')
        .select('professional_development, recent_learning_activities, future_learning_goals')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    if (!assessmentRes.data) {
      return new NextResponse('No assessment found', { status: 404 })
    }

    const assessment: any = assessmentRes.data
    const workExperiences: any[] = workExpRes.data || []
    const knowledge: any | null = knowledgeRes.data || null
    const profile: any | null = userRes.data || null

    // Build a PDF using jsPDF on the server (no DOM screenshotting)
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })

    const left = 48
    let y = 56

    // Header
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.text('Unison AI', left, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(12)
    pdf.text('Productivity Assessment Report', left, (y += 20))

    // Summary card
    y += 24
    pdf.setDrawColor(10, 37, 64) // #0A2540
    pdf.setLineWidth(0.8)
    pdf.roundedRect(left - 8, y - 20, 520, 90, 8, 8, 'S')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.text('Общая оценка продуктивности', left, y)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const roleText = assessment.role_type ? `Role: ${assessment.role_type}` : undefined
    const nameText = profile?.full_name ? `Name: ${profile.full_name}` : undefined
    const headerLines = [
      'На основе анализа опыта работы и компетенций',
      [roleText, nameText].filter(Boolean).join('  •  ')
    ].filter(Boolean) as string[]
    y += 18
    headerLines.forEach((line) => {
      if (!line) return
      pdf.text(line, left, y)
      y += 16
    })
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(36)
    pdf.setTextColor(0, 196, 154) // #00C49A
    pdf.text(`${assessment.overall_productivity_score ?? '—'}%`, left + 360, y - 6)
    pdf.setTextColor(0, 0, 0)

    // Motivation and tests (right column-like block)
    y += 18
    pdf.setFont('helvetica', 'bold')
    pdf.text('Уровень мотивации:', left, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${assessment.motivation_level ?? '—'}`, left + 160, y)

    y += 18
    pdf.setFont('helvetica', 'bold')
    pdf.text('Результаты тестов:', left, y)
    pdf.setFont('helvetica', 'normal')
    y += 16
    const testLines = [
      `IQ Test: ${assessment.iq_test_score ?? '—'}`,
      `Тест восприятия: ${assessment.personality_test_score ?? '—'}`,
      `Тест лидерства: ${assessment.leadership_test_score ?? '—'}`,
    ]
    testLines.forEach((line) => {
      pdf.text(line, left + 16, y)
      y += 16
    })

    // Work experience
    if (workExperiences.length) {
      y += 8
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text('Опыт работы', left, y)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(12)
      y += 12
      workExperiences.slice(0, 5).forEach((exp) => {
        const title = `${exp.position ?? '—'} — ${exp.company_name ?? '—'}`
        pdf.text(title, left, (y += 18))
        const dates = `${exp.start_date ?? '—'} — ${exp.end_date || 'По наст.'}`
        pdf.setTextColor(100)
        pdf.text(dates, left, (y += 14))
        pdf.setTextColor(0)
        y += 6
        if (y > 740) {
          pdf.addPage()
          y = 56
        }
      })
    }

    // Knowledge summary
    if (knowledge) {
      y += 12
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text('Знания и компетенции', left, y)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(12)
      y += 12
      const knowledgeText = [
        knowledge.professional_development,
        knowledge.recent_learning_activities,
        knowledge.future_learning_goals,
      ]
        .filter(Boolean)
        .join('\n\n') || '—'

      const wrapped = pdf.splitTextToSize(knowledgeText, 520)
      wrapped.forEach((line: string) => {
        if (y > 780) {
          pdf.addPage();
          y = 56
        }
        pdf.text(line, left, y)
        y += 16
      })
    }

    // Verification footer
    const secret = process.env.REPORT_SIGNING_SECRET || 'dev-secret'
    const signature = signAssessment(assessment.id, assessment.completed_at ?? assessment.created_at ?? null, secret)
    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
    const verifyPath = `/api/productivity/report/verify?assessmentId=${encodeURIComponent(assessment.id)}&sig=${signature}`

    y = Math.min(y + 16, 800)
    pdf.setDrawColor(230)
    pdf.line(left - 8, y, left + 520, y)
    y += 18
    pdf.setFontSize(10)
    pdf.setTextColor(90)
    pdf.text(`Verify: ${origin}${verifyPath}`, left, y)
    y += 14
    pdf.text('Generated by Unison AI • This PDF is server-generated from trusted data.', left, y)
    pdf.setTextColor(0)

    const arrayBuffer = pdf.output('arraybuffer')
    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="productivity-report.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('PDF generation failed:', error)
    return new NextResponse('Failed to generate PDF', { status: 500 })
  }
}


