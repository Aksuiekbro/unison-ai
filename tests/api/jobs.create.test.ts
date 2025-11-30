import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createJob } from '@/lib/actions/jobs'

const { jobsInsertSpy, jobsSingleSpy } = vi.hoisted(() => ({
  jobsInsertSpy: vi.fn(),
  jobsSingleSpy: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => {
  const usersSingle = vi.fn().mockResolvedValue({
    data: { id: 'employer-1', role: 'employer', email: 'owner@example.com' },
    error: null,
  })

  const companiesSingle = vi.fn().mockResolvedValue({
    data: { id: 'company-1', owner_id: 'employer-1' },
    error: null,
  })

  const companiesQuery = {
    eq: vi.fn(function () {
      return companiesQuery
    }),
    order: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        maybeSingle: companiesSingle,
      }),
    }),
    limit: vi.fn().mockReturnValue({
      maybeSingle: companiesSingle,
    }),
    maybeSingle: companiesSingle,
    single: companiesSingle,
  }

  jobsSingleSpy.mockResolvedValue({
    data: { id: 'job-1' },
    error: null,
  })

  const jobsInsert = jobsInsertSpy.mockImplementation((payload) => {
    return {
      select: vi.fn().mockReturnValue({
        single: jobsSingleSpy,
      }),
    }
  })

  return {
    supabaseAdmin: {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: usersSingle,
              }),
            }),
          }
        }
        if (table === 'companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue(companiesQuery),
            }),
          }
        }
        if (table === 'jobs') {
          return {
            insert: jobsInsert,
          }
        }
        return {}
      }),
      auth: { admin: { getUserById: vi.fn() } },
    },
  }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('createJob', () => {
  beforeEach(() => {
    jobsInsertSpy.mockClear()
    jobsSingleSpy.mockClear()
  })

  it('strips unsupported fields before inserting', async () => {
    const input = {
      title: 'Senior Engineer',
      description: 'Build cool stuff',
      requirements: ['JS', 'TS'],
    responsibilities: ['Ship'],
    job_type: 'full_time' as const,
    experience_level: 'mid' as const,
      salary_min: 1000,
      salary_max: 2000,
      currency: 'KZT',
      location: 'Almaty',
      remote_allowed: true,
      status: 'published' as const,
      company_id: 'company-1',
      department: 'design',
    }

    const result = await createJob(input as any, 'employer-1')

    expect(result.success).toBe(true)
    expect(jobsInsertSpy).toHaveBeenCalledTimes(1)
    const insertedPayload = jobsInsertSpy.mock.calls[0][0][0]
    expect(insertedPayload.department).toBeUndefined()
    expect(insertedPayload.title).toBe(input.title)
    expect(insertedPayload.company_id).toBe('company-1')
    expect(insertedPayload.employer_id).toBe('employer-1')
    expect(insertedPayload.posted_at).toBeTruthy()
  })
})
