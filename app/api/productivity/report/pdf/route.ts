import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export const runtime = 'nodejs'

function signAssessment(assessmentId: string, completedAt: string | null, secret: string) {
  const payload = `${assessmentId}.${completedAt ?? ''}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

// Cache fonts between invocations (serverless warm instances)
let cachedFontRegularBase64: string | null = null
let cachedFontBoldBase64: string | null = null

async function loadFontBase64(kind: 'regular' | 'bold', origin: string): Promise<string> {
  const cached = kind === 'regular' ? cachedFontRegularBase64 : cachedFontBoldBase64
  if (cached) return cached

  const fileName = kind === 'regular' ? 'NotoSans-Regular.ttf' : 'NotoSans-Bold.ttf'

  // Try to read from public/fonts first
  try {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const p = path.join(process.cwd(), 'public', 'fonts', fileName)
    const buf = await fs.readFile(p)
    const b64 = buf.toString('base64')
    if (kind === 'regular') cachedFontRegularBase64 = b64
    else cachedFontBoldBase64 = b64
    return b64
  } catch {}

  // Fallback: fetch from CDN (fontsource hosts TTF with Cyrillic subsets)
  const url = kind === 'regular'
    ? 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.17/files/noto-sans-cyrillic-400-normal.ttf'
    : 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.17/files/noto-sans-cyrillic-700-normal.ttf'
  const res = await fetch(url)
  if (!res.ok) {
    // Final fallback: try same-origin public/fonts via HTTP
    const localUrl = `${origin}/fonts/${fileName}`
    const res2 = await fetch(localUrl)
    if (!res2.ok) throw new Error(`Failed to load font: ${fileName}`)
    const arr2 = new Uint8Array(await res2.arrayBuffer())
    const b642 = Buffer.from(arr2).toString('base64')
    if (kind === 'regular') cachedFontRegularBase64 = b642
    else cachedFontBoldBase64 = b642
    return b642
  }
  const arr = new Uint8Array(await res.arrayBuffer())
  const b64 = Buffer.from(arr).toString('base64')
  if (kind === 'regular') cachedFontRegularBase64 = b64
  else cachedFontBoldBase64 = b64
  return b64
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

    // Embed Unicode font (Cyrillic support)
    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
    const [regularB64, boldB64] = await Promise.all([
      loadFontBase64('regular', origin),
      loadFontBase64('bold', origin),
    ])
    // jsPDF expects binary (latin1) string for VFS contents. Convert from base64.
    const regularBinary = Buffer.from(regularB64, 'base64').toString('latin1')
    const boldBinary = Buffer.from(boldB64, 'base64').toString('latin1')
    pdf.addFileToVFS('NotoSans-Regular.ttf', regularBinary)
    pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
    pdf.addFileToVFS('NotoSans-Bold.ttf', boldBinary)
    pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold')
    pdf.setFont('NotoSans', 'normal')

    const left = 48
    let y = 56

    // Helpers
    const pageHeight = pdf.internal.pageSize.getHeight()
    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 40) {
        pdf.addPage()
        y = 56
      }
    }

    // Header
    pdf.setFont('NotoSans', 'bold')
    pdf.setFontSize(20)
    pdf.text('Unison AI', left, y)
    pdf.setFont('NotoSans', 'normal')
    pdf.setFontSize(12)
    pdf.text('Productivity Assessment Report', left, (y += 20))

    // Summary card
    y += 24
    pdf.setDrawColor(10, 37, 64) // #0A2540
    pdf.setLineWidth(0.8)
    pdf.roundedRect(left - 8, y - 20, 520, 90, 8, 8, 'S')
    pdf.setFont('NotoSans', 'bold')
    pdf.setFontSize(16)
    pdf.text('Общая оценка продуктивности', left, y)
    pdf.setFontSize(12)
    pdf.setFont('NotoSans', 'normal')
    const roleText = assessment.role_type ? `Role: ${assessment.role_type}` : undefined
    const nameText = profile?.full_name ? `Name: ${profile.full_name}` : undefined
    const headerLines = [
      'На основе анализа опыта работы и компетенций',
      [roleText, nameText].filter(Boolean).join('  •  ')
    ].filter(Boolean) as string[]
    y += 18
    headerLines.forEach((line) => {
      if (!line) return
      ensureSpace(16)
      pdf.text(line, left, y)
      y += 16
    })
    pdf.setFont('NotoSans', 'bold')
    pdf.setFontSize(36)
    pdf.setTextColor(0, 196, 154) // #00C49A
    pdf.text(`${assessment.overall_productivity_score ?? '—'}%`, left + 360, y - 6)
    pdf.setTextColor(0, 0, 0)

    // Motivation and tests (right column-like block)
    y += 18
    pdf.setFont('NotoSans', 'bold')
    pdf.text('Уровень мотивации:', left, y)
    pdf.setFont('NotoSans', 'normal')
    pdf.text(`${assessment.motivation_level ?? '—'}`, left + 160, y)

    y += 18
    pdf.setFont('NotoSans', 'bold')
    pdf.text('Результаты тестов:', left, y)
    pdf.setFont('NotoSans', 'normal')
    y += 16
    const testLines = [
      `IQ Test: ${assessment.iq_test_score ?? '—'}`,
      `Тест восприятия: ${assessment.personality_test_score ?? '—'}`,
      `Тест лидерства: ${assessment.leadership_test_score ?? '—'}`,
    ]
    testLines.forEach((line) => {
      ensureSpace(16)
      pdf.text(line, left + 16, y)
      y += 16
    })

    // Work experience
    if (workExperiences.length) {
      y += 8
      pdf.setFont('NotoSans', 'bold')
      pdf.setFontSize(16)
      pdf.text('Опыт работы', left, y)
      pdf.setFont('NotoSans', 'normal')
      pdf.setFontSize(12)
      y += 12
      workExperiences.slice(0, 5).forEach((exp) => {
        const title = `${exp.position ?? '—'} — ${exp.company_name ?? '—'}`
        ensureSpace(18)
        pdf.text(title, left, (y += 18))
        const dates = `${exp.start_date ?? '—'} — ${exp.end_date || 'По наст.'}`
        pdf.setTextColor(100)
        ensureSpace(14)
        pdf.text(dates, left, (y += 14))
        pdf.setTextColor(0)
        y += 6
      })
    }

    // Knowledge summary
    if (knowledge) {
      y += 12
      pdf.setFont('NotoSans', 'bold')
      pdf.setFontSize(16)
      pdf.text('Знания и компетенции', left, y)
      pdf.setFont('NotoSans', 'normal')
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
        ensureSpace(16)
        pdf.text(line, left, y)
        y += 16
      })
    }

    // Verification footer
    const secret = process.env.REPORT_SIGNING_SECRET || 'dev-secret'
    const signature = signAssessment(assessment.id, assessment.completed_at ?? assessment.created_at ?? null, secret)
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


