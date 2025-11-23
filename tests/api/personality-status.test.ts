import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/personality/status/route'

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn()
}))

import { createClient } from '@/lib/supabase-server'

describe('Personality Status API Route', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn()
      },
      from: vi.fn()
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  it('returns 401 when user is unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not logged in' }
    })

    const request = new NextRequest('http://localhost/api/personality/status')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns current status when analysis row exists', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        status: 'processing',
        queued_at: '2025-11-21T12:00:00Z',
        processed_at: null,
        error_message: null,
        updated_at: '2025-11-21T12:01:00Z'
      },
      error: null
    })

    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })

    mockSupabase.from.mockReturnValue({ select })

    const request = new NextRequest('http://localhost/api/personality/status')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      status: 'processing',
      queuedAt: '2025-11-21T12:00:00Z',
      processedAt: null,
      error: null,
      lastUpdated: '2025-11-21T12:01:00Z',
      isReady: false
    })
    expect(mockSupabase.from).toHaveBeenCalledWith('personality_analysis')
    expect(select).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(maybeSingle).toHaveBeenCalled()
  })
})
