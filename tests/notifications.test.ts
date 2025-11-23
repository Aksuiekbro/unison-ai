import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyCandidateStatusChange } from '@/lib/notifications'

const originalFetch = global.fetch

describe('notifications', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.RESEND_API_KEY = 'test_resend_key'
  })

  it('falls back to Resend when no endpoint is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'email-1' }) })
    global.fetch = fetchMock as any

    const result = await notifyCandidateStatusChange({
      applicationId: 'app-1',
      status: 'interview',
      candidateEmail: 'user@example.com',
      candidateName: 'User',
      jobTitle: 'Engineer',
      companyName: 'Acme',
      notes: 'Be on time'
    })

    expect(result.delivered).toBe(true)
    expect(fetchMock).toHaveBeenCalled()

    global.fetch = originalFetch
  })
})
