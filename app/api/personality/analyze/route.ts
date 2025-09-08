import { NextRequest, NextResponse } from 'next/server'
import { analyzePersonality, validatePersonalityAnalysis } from '@/lib/ai/personality-analyzer'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

interface TestResponse {
  questionId: string
  questionText: string
  response: string
  category: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify user authentication
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

    console.log('Processing personality analysis for user:', user.id)

    // Get question details from database or default questions
    const questionMap = {
      'q1': { text: 'Опишите самую большую неудачу в вашей карьере и что она вас научила.', category: 'problem_solving' },
      'q2': { text: 'Расскажите о ситуации, когда вам пришлось работать в команде с конфликтными людьми. Как вы решили эту проблему?', category: 'teamwork' },
      'q3': { text: 'Опишите проект или инициативу, которую вы начали сами, без указания руководства.', category: 'initiative' },
      'q4': { text: 'Как вы обычно принимаете важные решения? Опишите свой процесс на конкретном примере.', category: 'decision_making' },
      'q5': { text: 'Расскажите о времени, когда вам пришлось изучить что-то совершенно новое для работы. Как вы подошли к обучению?', category: 'learning' },
      'q6': { text: 'Опишите ситуацию, когда вы не согласились с решением руководства. Как вы отреагировали?', category: 'leadership' },
      'q7': { text: 'Что вас мотивирует больше всего в работе? Приведите конкретные примеры.', category: 'motivation' }
    }

    // Transform responses for AI analysis
    const questionResponses = Object.entries(responses).map(([questionId, response]) => {
      const questionInfo = questionMap[questionId as keyof typeof questionMap]
      return {
        question_id: questionId,
        question_text: questionInfo?.text || 'Question not found',
        response_text: response as string,
        category: questionInfo?.category || 'general'
      }
    })

    // Store responses in database first
    try {
      // Delete existing responses for this user
      await supabase
        .from('test_responses')
        .delete()
        .eq('user_id', user.id)

      // Insert new responses
      const responseInserts = questionResponses.map(qr => ({
        user_id: user.id,
        question_id: qr.question_id, // This will be a string ID, not UUID reference
        response_text: qr.response_text
      }))

      const { error: responseError } = await supabase
        .from('test_responses')
        .insert(responseInserts)

      if (responseError) {
        console.error('Error storing test responses:', responseError)
        // Continue anyway - analysis is more important
      }
    } catch (dbError) {
      console.error('Database error storing responses:', dbError)
      // Continue anyway
    }

    // Analyze personality using AI
    const analysisResult = await analyzePersonality(questionResponses)

    if (!analysisResult.success || !analysisResult.data) {
      return NextResponse.json(
        { success: false, error: analysisResult.error || 'Failed to analyze personality' },
        { status: 500 }
      )
    }

    const analysis = analysisResult.data

    // Validate analysis result
    const validation = await validatePersonalityAnalysis(analysis)
    if (!validation.valid) {
      console.error('Invalid analysis result:', validation.errors)
      return NextResponse.json(
        { success: false, error: 'AI analysis produced invalid results' },
        { status: 500 }
      )
    }

    // Store personality analysis in database
    try {
      // Delete existing analysis for this user
      await supabase
        .from('personality_analysis')
        .delete()
        .eq('user_id', user.id)

      // Insert new analysis
      const { error: analysisError } = await supabase
        .from('personality_analysis')
        .insert({
          user_id: user.id,
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
          ai_confidence_score: analysis.confidence_score,
          analysis_version: '1.0'
        })

      if (analysisError) {
        console.error('Error storing personality analysis:', analysisError)
        // Continue anyway - we can still return the result
      }

      // Update user profile to mark personality test as completed
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          personality_test_completed: true,
          ai_analysis_completed: true
        }, {
          onConflict: 'user_id'
        })

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }

    } catch (dbError) {
      console.error('Database error storing analysis:', dbError)
      // Don't fail the request - analysis was successful
    }

    // Return successful analysis
    return NextResponse.json({
      success: true,
      analysis,
      message: 'Personality analysis completed successfully'
    })

  } catch (error) {
    console.error('Personality analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze personality responses' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}