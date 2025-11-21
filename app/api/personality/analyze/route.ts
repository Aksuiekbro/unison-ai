import { NextRequest, NextResponse, unstable_after } from 'next/server'
import { analyzePersonality, validatePersonalityAnalysis, QuestionResponse } from '@/lib/ai/personality-analyzer'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const STATUS_MESSAGES: Record<string, string> = {
  queued: 'Ваши ответы сохранены. Анализ начнется в ближайшие секунды.',
  processing: 'ИИ работает над вашими ответами.',
  completed: 'Анализ готов к просмотру.',
  failed: 'Не удалось завершить анализ. Попробуйте позже.'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { responses } = await request.json()
    if (!responses || Object.keys(responses).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No responses provided' },
        { status: 400 }
      )
    }

    const { data: questionsFromDB, error: questionsError } = await supabase
      .from('questionnaires')
      .select('id, question_text, category, order_index')
      .eq('is_active', true)
      .order('order_index')

    if (questionsError) {
      console.error('Error fetching questions from database:', questionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch questions from database' },
        { status: 500 }
      )
    }

    const questionMapping: Record<string, { uuid: string; text: string; category: string }> = {}
    if (questionsFromDB) {
      questionsFromDB.forEach((q, index) => {
        const frontendId = (index + 1).toString()
        questionMapping[frontendId] = {
          uuid: q.id,
          text: q.question_text,
          category: q.category || 'general'
        }
      })
    }

    const questionResponses: QuestionResponse[] = Object.entries(responses).map(([questionId, response]) => {
      const questionInfo = questionMapping[questionId]
      if (!questionInfo) {
        console.warn(`Question ID ${questionId} not found in database`)
        return {
          question_id: questionId,
          question_text: 'Question not found',
          response_text: String(response),
          category: 'general'
        }
      }
      return {
        question_id: questionInfo.uuid,
        question_text: questionInfo.text,
        response_text: String(response),
        category: questionInfo.category
      }
    })

    try {
      const { error: deleteError } = await supabase
        .from('test_responses')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting existing test responses:', deleteError)
        return NextResponse.json(
          { success: false, error: 'Failed to reset previous test responses' },
          { status: 500 }
        )
      }

      const responseInserts = Object.entries(responses).reduce<{ user_id: string; question_id: string; response_text: string }[]>((acc, [questionId, response]) => {
        const questionInfo = questionMapping[questionId]
        if (!questionInfo) {
          return acc
        }
        acc.push({
          user_id: user.id,
          question_id: questionInfo.uuid,
          response_text: String(response)
        })
        return acc
      }, [])

      if (responseInserts.length > 0) {
        const { error: responseError } = await supabase
          .from('test_responses')
          .insert(responseInserts)

        if (responseError) {
          console.error('Error storing test responses:', responseError)
        }
      }
    } catch (dbError) {
      console.error('Database error storing responses:', dbError)
    }
    const nowIso = new Date().toISOString()
    const { error: queueError } = await supabase
      .from('personality_analysis')
      .upsert(
        {
          user_id: user.id,
          status: 'queued',
          queued_at: nowIso,
          processed_at: null,
          error_message: null
        },
        { onConflict: 'user_id', ignoreDuplicates: false }
      )

    if (queueError) {
      console.error('Error queuing personality analysis:', queueError)
      return NextResponse.json(
        { success: false, error: 'Failed to queue analysis' },
        { status: 500 }
      )
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          personality_test_completed: true,
          ai_analysis_completed: false
        },
        {
          onConflict: 'user_id',
          defaultToNull: false
        }
      )

    if (profileError) {
      console.error('Error updating profile completion flags:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to update profile status' },
        { status: 500 }
      )
    }

    const shouldProcessInline = process.env.PERSONALITY_ANALYSIS_INLINE === 'true'
    const isTestEnv = process.env.NODE_ENV === 'test'

    if (shouldProcessInline) {
      await processPersonalityAnalysisInBackground(user.id, questionResponses)
    } else if (!isTestEnv) {
      unstable_after(async () => {
        await processPersonalityAnalysisInBackground(user.id, questionResponses)
      })
    }

    const status = 'queued'
    return NextResponse.json({
      success: true,
      status,
      message: STATUS_MESSAGES[status]
    })
  } catch (error) {
    console.error('Personality analysis queue error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit personality test' },
      { status: 500 }
    )
  }
}

async function processPersonalityAnalysisInBackground(
  userId: string,
  questionResponses: QuestionResponse[]
) {
  try {
    await supabaseAdmin
      .from('personality_analysis')
      .update({ status: 'processing', processed_at: null, error_message: null })
      .eq('user_id', userId)

    const analysisResult = await analyzePersonality(questionResponses)
    if (!analysisResult.success || !analysisResult.data) {
      const errorMessage = analysisResult.error || 'Failed to analyze personality'
      await markAnalysisFailed(userId, errorMessage)
      return
    }

    const analysis = analysisResult.data
    const validation = await validatePersonalityAnalysis(analysis)
    if (!validation.valid) {
      const message = `AI analysis produced invalid results: ${validation.errors.join(', ')}`
      await markAnalysisFailed(userId, message)
      return
    }

    await supabaseAdmin
      .from('personality_analysis')
      .upsert(
        {
          user_id: userId,
          problem_solving_style: analysis.problem_solving_style,
          initiative_level: analysis.initiative_level,
          work_preference: analysis.work_preference,
          motivational_factors: analysis.motivational_factors,
          growth_areas: analysis.growth_areas,
          communication_style: analysis.communication_style,
          leadership_potential: analysis.leadership_potential,
          analytical_score: analysis.analytical_score,
          creative_score: analysis.creative_score,
          leadership_score: analysis.leadership_score,
          teamwork_score: analysis.teamwork_score,
          trait_scores: analysis.trait_scores,
          ai_confidence_score: analysis.confidence_score,
          analysis_version: '1.0',
          status: 'completed',
          processed_at: new Date().toISOString(),
          error_message: null
        },
        { onConflict: 'user_id', ignoreDuplicates: false }
      )

    await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          user_id: userId,
          ai_analysis_completed: true
        },
        {
          onConflict: 'user_id',
          defaultToNull: false
        }
      )

    const { error: userFlagError } = await supabaseAdmin
      .from('users')
      .update({ personality_assessment_completed: true })
      .eq('id', userId)

    if (userFlagError) {
      console.error('Error updating user completion flag after analysis:', userFlagError)
    }
  } catch (error) {
    console.error('Background personality analysis failed:', error)
    await markAnalysisFailed(userId, 'Internal error while processing analysis')
  }
}

async function markAnalysisFailed(userId: string, errorMessage: string) {
  try {
    await supabaseAdmin
      .from('personality_analysis')
      .upsert(
        {
          user_id: userId,
          status: 'failed',
          processed_at: new Date().toISOString(),
          error_message: errorMessage
        },
        { onConflict: 'user_id', ignoreDuplicates: false }
      )

    await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          user_id: userId,
          ai_analysis_completed: false
        },
        {
          onConflict: 'user_id',
          defaultToNull: false
        }
      )

    const { error: userFlagError } = await supabaseAdmin
      .from('users')
      .update({ personality_assessment_completed: false })
      .eq('id', userId)

    if (userFlagError) {
      console.error('Error clearing user completion flag after failure:', userFlagError)
    }
  } catch (error) {
    console.error('Failed to mark personality analysis as failed:', error)
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
