import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mutable role used by our mocks
let mockRole: 'employee' | 'job_seeker' | 'job-seeker' | 'employer' = 'employee'

vi.mock('next/navigation', () => {
  return {
    redirect: (url: string) => {
      const err: any = new Error('NEXT_REDIRECT')
      err.digest = 'NEXT_REDIRECT'
      err.url = url
      throw err
    }
  }
})

vi.mock('next/headers', () => {
  const store = new Map<string, string>()
  return {
    cookies: async () => ({
      get: (name: string) => ({ name, value: store.get(name) ?? '' }),
      set: ({ name, value }: any) => { store.set(name, value) },
    })
  }
})

vi.mock('@supabase/auth-helpers-nextjs', () => {
  return {
    createServerActionClient: () => ({
      auth: {
        signInWithPassword: async () => ({
          data: { user: { id: 'user-1', user_metadata: { role: mockRole, full_name: 'Test User' } } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { role: mockRole } }),
            maybeSingle: async () => ({ data: { role: mockRole } }),
          }),
        }),
      }),
    }),
  }
})

import { loginAction } from '@/app/auth/login/action'

describe('loginAction redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRole = 'employee'
  })

  it('returns success with role for valid credentials', async () => {
    const form = new FormData()
    form.set('email', 'timeywimey65@gmail.com')
    form.set('password', 'password123')

    const result = await loginAction(null as any, form)
    expect(result.success).toBe(true)
    expect(result.role).toBe('employee')
  })

  it('returns success with employee role', async () => {
    mockRole = 'employee'
    const form = new FormData()
    form.set('email', 'timeywimey65@gmail.com')
    form.set('password', 'password123')

    const result = await loginAction(null as any, form)
    expect(result.success).toBe(true)
    expect(result.role).toBe('employee')
  })

  it('returns success with employer role', async () => {
    mockRole = 'employer'
    const form = new FormData()
    form.set('email', 'timeywimey65@gmail.com')
    form.set('password', 'password123')

    const result = await loginAction(null as any, form)
    expect(result.success).toBe(true)
    expect(result.role).toBe('employer')
  })
})


