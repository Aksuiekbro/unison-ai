import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/personality/analyze/route'

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn()
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    }))
  }
}))

vi.mock('@/lib/ai/personality-analyzer', () => ({
  analyzePersonality: vi.fn(),
  validatePersonalityAnalysis: vi.fn()
}))

import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { analyzePersonality, validatePersonalityAnalysis } from '@/lib/ai/personality-analyzer'

describe('Personality Analyze API Route', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

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
            upsert: vi.fn().mockResolvedValue({ error: null })
          }
        }
        if (table === 'questionnaires') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'uuid-1', question_text: 'Q1', category: 'general', order_index: 1 },
                    { id: 'uuid-2', question_text: 'Q2', category: 'general', order_index: 2 },
                  ],
                  error: null
                })
              })
            })
          }
        }
        if (table === 'users') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }
        }
        return {}
      })
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  it('maps numeric IDs to DB questions and enqueues analysis', async () => {
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
        confidence_score: 0.85,
        trait_scores: { focus: 70 }
      },
      error: undefined
    } as any)

    vi.mocked(validatePersonalityAnalysis).mockResolvedValue({ valid: true, errors: [] })

    const requestBody = {
      responses: {
        1: 'I enjoy solving complex problems with data-driven methods.',
        2: 'I like collaborating with cross-functional teams to deliver impact.'
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
    expect(result.status).toBe('queued')
    expect(analyzePersonality).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(analyzePersonality).mock.calls[0][0]
    expect(arg[0]).toMatchObject({
      question_id: 'uuid-1',
      question_text: 'Q1'
    })
  })

  it('falls back to default questions when DB is empty and supports q-prefixed IDs', async () => {
    // Make questionnaires return empty
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    })
    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'questionnaires') {
        return { select: mockSelect }
      }
      if (table === 'test_responses') {
        return {
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          insert: vi.fn().mockResolvedValue({ error: null })
        }
      }
      if (table === 'personality_analysis') {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) }
      }
      if (table === 'users') {
        return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }
      }
      if (table === 'questionnaires') return { select: mockSelect }
      return {}
    })

    vi.mocked(createClient).mockResolvedValue(mockSupabase)

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-999' } },
      error: null
    })

    vi.mocked(analyzePersonality).mockResolvedValue({ success: true, data: { analytical_score: 70, creative_score: 60 }, error: null } as any)
    vi.mocked(validatePersonalityAnalysis).mockResolvedValue({ valid: true, errors: [] })

    const requestBody = { responses: { q1: 'Fallback Q1 answer', q2: 'Fallback Q2 answer' } }
    const request = new NextRequest('http://localhost/api/personality/analyze', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(analyzePersonality).toHaveBeenCalledTimes(1)
    const args = vi.mocked(analyzePersonality).mock.calls[0][0]
    expect(args[0].question_id).toBe('q1')
    expect(args[0].question_text).toContain('неудачу')
  })
})

