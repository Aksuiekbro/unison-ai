import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn()
}))

import { createServerClient } from '@supabase/ssr'

describe('middleware route gating', () => {
  const mockResponse = {
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      getAll: vi.fn().mockReturnValue([])
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated job seeker search to login with redirectTo', async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
      },
      from: vi.fn()
    } as any)

    const req = new NextRequest('http://localhost/job-seeker/search')
    const res = await middleware(req as any, mockResponse as any)

    expect(res?.headers.get('location')).toContain('/auth/login?redirectTo=%2Fjob-seeker%2Fsearch')
  })

  it('allows job seeker with completed personality test to access search', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'job_seeker', personality_assessment_completed: true }
          })
        })
      })
    })

    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
      },
      from: mockFrom
    } as any)

    const req = new NextRequest('http://localhost/job-seeker/search')
    const res = await middleware(req as any, mockResponse as any)

    // Allowed path: expect NextResponse.next() passthrough (no location header)
    expect(res?.headers.get('location')).toBeNull()
  })
})
