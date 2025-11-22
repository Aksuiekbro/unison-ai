import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as forgotPost } from '@/app/api/auth/forgot-password/route'
import { POST as resetPost } from '@/app/api/auth/reset-password/route'

vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: null })
    }
  }
}))

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn()
}))

import { supabase } from '@/lib/supabase-client'
import { createClient } from '@/lib/supabase-server'

describe('Auth password reset flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles forgot-password happy path', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' })
    })

    const res = await forgotPost(request as any)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect((supabase as any).auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', expect.any(Object))
  })

  it('updates password when recovery session is valid', async () => {
    // Mock supabase server client for auth.getUser and updateUser
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        }),
        updateUser
      }
    }
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'new-password123', confirmPassword: 'new-password123' })
    })

    const res = await resetPost(request as any)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password123' })
  })
})
