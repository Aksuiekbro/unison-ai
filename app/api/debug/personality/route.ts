import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supa = await createClient()
    const { data: { user } } = await supa.auth.getUser()

    // Table existence checks via to_regclass
    const exists = async (t: string) => {
      const { data, error } = await supa.rpc('pg_catalog.to_regclass', { text: `public.${t}` } as any)
      return !error && data != null
    }

    const [hasPA, hasTR, hasQ] = await Promise.all([
      exists('personality_analysis'),
      exists('test_responses'),
      exists('questionnaires'),
    ])

    // Active questions count
    const { count: questions } = await supa
      .from('questionnaires')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    // Current user analysis row
    let hasAnalysis = false
    if (user && hasPA) {
      const { data } = await supa
        .from('personality_analysis')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      hasAnalysis = !!data
    }

    return NextResponse.json({
      user: !!user,
      tables: {
        personality_analysis: hasPA,
        test_responses: hasTR,
        questionnaires: hasQ,
      },
      questions: questions ?? 0,
      hasAnalysis,
    })
  } catch (e) {
    return NextResponse.json({ error: 'debug failed' }, { status: 500 })
  }
}


