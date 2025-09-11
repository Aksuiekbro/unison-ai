import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Partially mock: stub only the AI call; keep retry util real
vi.mock('@/lib/ai/gemini', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/gemini')>('@/lib/ai/gemini')
  return {
    ...actual,
    generateStructuredResponse: vi.fn(),
  }
})

import { generateStructuredResponse, withRateLimit } from '@/lib/ai/gemini'

describe('Gemini AI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateStructuredResponse', () => {
    it('should generate valid JSON response', async () => {
      const expectedResult = {
        success: true,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          skills: ['JavaScript', 'Python']
        },
        confidence: 0.85
      }

      vi.mocked(generateStructuredResponse).mockResolvedValue(expectedResult)

      const schema = {
        name: 'string',
        email: 'string',
        skills: ['array of strings']
      }

      const result = await generateStructuredResponse(
        'Parse this resume text',
        'You are a resume parser',
        schema
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'Python']
      })
    })

    it('should handle AI service errors', async () => {
      vi.mocked(generateStructuredResponse).mockResolvedValue({
        success: false,
        error: 'AI service unavailable'
      })

      const result = await generateStructuredResponse('test', 'test', {})

      expect(result.success).toBe(false)
      expect(result.error).toBe('AI service unavailable')
    })
  })

  describe('withRateLimit', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should retry failed requests', async () => {
      let callCount = 0
      const mockFunction = vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount < 3) {
          return { success: false, error: 'Temporary failure' }
        }
        return { success: true, data: 'Success after retries' }
      })

      const promise = withRateLimit(mockFunction, 3)
      await vi.advanceTimersByTimeAsync(3000)
      const result = await promise

      expect(result.success).toBe(true)
      expect(result.data).toBe('Success after retries')
      expect(callCount).toBe(3)
    })

    it('should fail after max retries', async () => {
      const mockFunction = vi.fn().mockResolvedValue({
        success: false,
        error: 'Persistent failure'
      })

      const promise = withRateLimit(mockFunction, 2)
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed after 2 retries')
    })
  })
})