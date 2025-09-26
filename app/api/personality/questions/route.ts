import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    question_text: 'Опишите самую большую неудачу в вашей карьере и что она вас научила.',
    category: 'problem_solving',
    order_index: 1,
    is_active: true
  },
  {
    id: 'q2',
    question_text: 'Расскажите о ситуации, когда вам пришлось работать в команде с конфликтными людьми. Как вы решили эту проблему?',
    category: 'teamwork', 
    order_index: 2,
    is_active: true
  },
  {
    id: 'q3',
    question_text: 'Опишите проект или инициативу, которую вы начали сами, без указания руководства.',
    category: 'initiative',
    order_index: 3,
    is_active: true
  },
  {
    id: 'q4',
    question_text: 'Как вы обычно принимаете важные решения? Опишите свой процесс на конкретном примере.',
    category: 'decision_making',
    order_index: 4,
    is_active: true
  },
  {
    id: 'q5',
    question_text: 'Расскажите о времени, когда вам пришлось изучить что-то совершенно новое для работы. Как вы подошли к обучению?',
    category: 'learning',
    order_index: 5,
    is_active: true
  },
  {
    id: 'q6',
    question_text: 'Опишите ситуацию, когда вы не согласились с решением руководства. Как вы отреагировали?',
    category: 'leadership',
    order_index: 6,
    is_active: true
  },
  {
    id: 'q7', 
    question_text: 'Что вас мотивирует больше всего в работе? Приведите конкретные примеры.',
    category: 'motivation',
    order_index: 7,
    is_active: true
  }
]

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )
    
    // Verify user authentication for questions access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to get questions from database first
    const { data: questions, error } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('Database error fetching questions:', error)
      // Fall back to default questions
      return NextResponse.json({
        success: true,
        questions: DEFAULT_QUESTIONS
      })
    }

    // If no questions in database, return default questions
    if (!questions || questions.length === 0) {
      return NextResponse.json({
        success: true,
        questions: DEFAULT_QUESTIONS
      })
    }

    // Return questions from database
    return NextResponse.json({
      success: true,
      questions
    })

  } catch (error) {
    console.error('Error fetching personality questions:', error)
    
    // Always fall back to default questions
    return NextResponse.json({
      success: true,
      questions: DEFAULT_QUESTIONS
    })
  }
}

// POST endpoint to seed default questions into database
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )
    
    // Verify user authentication - only authenticated users can seed
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if questions already exist and get exact count
    const { count: existingCount, error: existingCountError } = await supabase
      .from('questionnaires')
      .select('id', { count: 'exact', head: true })

    if (existingCountError) {
      console.error('Database error checking questions count:', existingCountError)
      return NextResponse.json(
        { success: false, error: 'Failed to check existing questions' },
        { status: 500 }
      )
    }

    if ((existingCount ?? 0) > 0) {
      return NextResponse.json({
        success: true,
        message: 'Questions already exist in database',
        count: existingCount
      })
    }

    // Insert default questions
    const questionsToInsert = DEFAULT_QUESTIONS.map(q => ({
      question_text: q.question_text,
      question_type: 'open_ended',
      category: q.category,
      is_active: q.is_active,
      order_index: q.order_index
    }))

    const { data, error } = await supabase
      .from('questionnaires')
      .insert(questionsToInsert)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Default questions seeded successfully',
      count: data.length
    })

  } catch (error) {
    console.error('Error seeding questions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed questions' },
      { status: 500 }
    )
  }
}