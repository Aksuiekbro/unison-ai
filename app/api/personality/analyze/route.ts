import { NextRequest, NextResponse } from 'next/server'
import { analyzePersonality, validatePersonalityAnalysis } from '@/lib/ai/personality-analyzer'
import { createClient } from '@/lib/supabase-server'
import type { Database } from '@/lib/database.types'

interface TestResponse {
  questionId: string
  questionText: string
  response: string
  category: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    // Get actual questions from database to ensure proper UUID mapping
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

    // Create mapping from frontend question IDs to database UUIDs
    const questionMapping: Record<string, { uuid: string; text: string; category: string }> = {}
    if (questionsFromDB) {
      questionsFromDB.forEach((q, index) => {
        const frontendId = (index + 1).toString() // Map '1' to first question, '2' to second, etc.
        questionMapping[frontendId] = {
          uuid: q.id,
          text: q.question_text,
          category: q.category || 'general'
        }
      })
    }

    // Transform responses for AI analysis using proper UUIDs
    const questionResponses = Object.entries(responses).map(([questionId, response]) => {
      const questionInfo = questionMapping[questionId]
      if (!questionInfo) {
        console.warn(`Question ID ${questionId} not found in database`)
        return {
          question_id: questionId,
          question_text: 'Question not found',
          response_text: response as string,
          category: 'general'
        }
      }
      return {
        question_id: questionInfo.uuid, // Use actual database UUID
        question_text: questionInfo.text,
        response_text: response as string,
        category: questionInfo.category
      }
    })

    // Store responses in database first
    try {
      // Delete existing responses for this user
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
      } catch (deleteCaughtError) {
        console.error('Unexpected error deleting existing test responses:', deleteCaughtError)
        return NextResponse.json(
          { success: false, error: 'Failed to reset previous test responses' },
          { status: 500 }
        )
      }

      // Insert new responses
      const responseInserts = questionResponses.map(qr => ({
        user_id: user.id,
        question_id: qr.question_id, // Now properly using database UUID reference
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

    // Store personality analysis in database (upsert by user_id)
    try {
      const { error: upsertErr } = await supabase
        .from('personality_analysis')
        .upsert({
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
          trait_scores: analysis.trait_scores,
          ai_confidence_score: analysis.confidence_score,
          analysis_version: '1.0'
        }, { onConflict: 'user_id' })

      if (upsertErr) {
        console.error('Error upserting personality analysis:', upsertErr)
        // Continue anyway - we can still return the result
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