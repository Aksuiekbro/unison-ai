import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', async () => {
  const actual = await vi.importActual<any>('@/lib/supabase-admin')
  const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })
  return {
    ...actual,
    supabaseAdmin: { from: vi.fn().mockReturnValue({ insert: insertMock }) },
  }
})

import { signupAction } from '@/app/auth/signup/action'
import { supabaseAdmin } from '@/lib/supabase-admin'

describe('signupAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes role employee/job-seeker to job_seeker and inserts profile with admin client', async () => {
    const form = new FormData()
    form.set('role', 'job-seeker')
    form.set('fullName', 'Jane Doe')
    form.set('email', 'jane@example.com')
    form.set('password', 'password123')

    const res = await signupAction(null as any, form)
    expect(res.success).toBe(true)

    // Ensure admin client used
    expect((supabaseAdmin as any).from).toHaveBeenCalledWith('profiles')
    const call = (supabaseAdmin as any).from.mock.results[0].value.insert.mock.calls[0][0]
    expect(call).toMatchObject({ id: 'user-1', role: 'job_seeker', email: 'jane@example.com' })
  })
})
