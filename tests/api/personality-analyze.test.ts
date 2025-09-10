import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/personality/analyze/route'

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

vi.mock('@/lib/ai/personality-analyzer', () => ({
  analyzePersonality: vi.fn(),
  validatePersonalityAnalysis: vi.fn()
}))

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { analyzePersonality, validatePersonalityAnalysis } from '@/lib/ai/personality-analyzer'

describe('Personality Analyze API Route', () => {
  let mockSupabase: any
  let upsertMock: any

  beforeEach(() => {
    vi.clearAllMocks()

    upsertMock = vi.fn().mockResolvedValue({ error: null })

    mockSupabase = {
      auth: {
        getUser: vi.fn()
      },
      from: vi.fn((table: string) => {
        if (table === 'test_responses') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          }
        }
        if (table === 'personality_analysis') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          }
        }
        if (table === 'profiles') {
          return {
            upsert: upsertMock
          }
        }
        return {}
      })
    }

    vi.mocked(createRouteHandlerClient).mockReturnValue(mockSupabase)
    vi.mocked(cookies).mockResolvedValue(new Map())
  })

  it('updates only personality flags without overwriting other profile fields', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    vi.mocked(analyzePersonality).mockResolvedValue({
      success: true,
      data: {
        problem_solving_style: 'Structured and logical approach',
        initiative_level: 'High',
        work_preference: 'Collaborative team environments',
        motivational_factors: 'Impact and ownership',
        growth_areas: 'Delegation and prioritization',
        communication_style: 'Clear and assertive',
        leadership_potential: 'Strong',
        analytical_score: 85,
        creative_score: 70,
        leadership_score: 80,
        teamwork_score: 88,
        personality_summary: 'Balanced, analytical collaborator',
        strengths: ['Collaboration', 'Analytical thinking'],
        development_areas: ['Delegation'],
        ideal_work_environment: 'Supportive, collaborative teams',
        confidence_score: 0.85,
        analysis_notes: 'Consistent responses'
      },
      error: undefined
    } as any)

    vi.mocked(validatePersonalityAnalysis).mockResolvedValue({ valid: true, errors: [] })

    const requestBody = {
      responses: {
        q1: 'I enjoy solving complex problems with data-driven methods.',
        q2: 'I like collaborating with cross-functional teams to deliver impact.'
      }
    }

    const request = new NextRequest('http://localhost/api/personality/analyze', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)

    // Ensure upsert was called correctly to avoid nulling other fields
    expect(upsertMock).toHaveBeenCalledTimes(1)
    const [valuesArg, options] = upsertMock.mock.calls[0]
    const payload = Array.isArray(valuesArg) ? valuesArg[0] : valuesArg

    expect(payload).toMatchObject({
      user_id: 'user-123',
      personality_test_completed: true,
      ai_analysis_completed: true
    })
    // Ensure we didn't accidentally include other fields in the payload
    expect(Object.keys(payload).sort()).toEqual([
      'ai_analysis_completed',
      'personality_test_completed',
      'user_id'
    ].sort())

    expect(options).toMatchObject({ onConflict: 'user_id', defaultToNull: false })
  })
})


