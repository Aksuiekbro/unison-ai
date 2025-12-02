import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createJob } from '@/lib/actions/jobs'

const { jobsInsertSpy, jobsSingleSpy, jobsSelectMock } = vi.hoisted(() => ({
  jobsInsertSpy: vi.fn(),
  jobsSingleSpy: vi.fn(),
  jobsSelectMock: vi.fn(),
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

  const jobsSelect = jobsSelectMock.mockReturnValue({
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
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
            select: jobsSelect,
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
    jobsSelectMock.mockClear()
    jobsSelectMock.mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
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

  it('omits employer_id when the column is missing', async () => {
    jobsSelectMock.mockReturnValueOnce({
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'column jobs.employer_id does not exist' },
      }),
    })

    const input = {
      title: 'QA Engineer',
      description: 'Test stuff',
      job_type: 'contract' as const,
      experience_level: 'entry' as const,
      status: 'draft' as const,
    }

    const result = await createJob(input as any, 'employer-1')

    expect(result.success).toBe(true)
    const insertedPayload = jobsInsertSpy.mock.calls[0][0][0]
    expect(insertedPayload.employer_id).toBeUndefined()
  })

  it('normalizes legacy statuses (active -> published, paused -> cancelled)', async () => {
    const resultActive = await createJob(
      {
        title: 'PM',
        description: 'Lead',
        job_type: 'full_time',
        experience_level: 'mid',
        status: 'active',
      } as any,
      'employer-1'
    )
    const payloadActive = jobsInsertSpy.mock.calls[jobsInsertSpy.mock.calls.length - 1][0][0]
    expect(resultActive.success).toBe(true)
    expect(payloadActive.status).toBe('published')

    const resultPaused = await createJob(
      {
        title: 'Designer',
        description: 'Design',
        job_type: 'contract',
        experience_level: 'entry',
        status: 'paused',
      } as any,
      'employer-1'
    )
    const payloadPaused = jobsInsertSpy.mock.calls[jobsInsertSpy.mock.calls.length - 1][0][0]
    expect(resultPaused.success).toBe(true)
    expect(payloadPaused.status).toBe('cancelled')
  })
})
