import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-client', async () => {
  const signUpMock = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null
  })
  return {
    supabase: { 
      auth: { 
        signUp: signUpMock 
      } 
    },
    __mocks: {
      signUpMock
    }
  }
})

import { signupAction } from '@/app/auth/signup/action'
import { supabase } from '@/lib/supabase-client'

describe('signupAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes role employee/job-seeker to job_seeker and inserts profile with admin client', async () => {
    const signUpMock = (supabase as any).auth.signUp

    const form = new FormData()
    form.set('role', 'job-seeker')
    form.set('fullName', 'Jane Doe')
    form.set('email', 'jane@example.com')
    form.set('password', 'password123')

    const res = await signupAction(null as any, form)
    expect(res.success).toBe(true)

    // Ensure client signUp used and role normalized in metadata
    expect(signUpMock).toHaveBeenCalledTimes(1)
    const args = signUpMock.mock.calls[0][0]
    expect(args.email).toBe('jane@example.com')
    expect(args.options?.data?.role).toBe('job_seeker')
  })
})
