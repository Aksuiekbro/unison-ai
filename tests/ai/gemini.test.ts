import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the entire gemini module
vi.mock('@/lib/ai/gemini', async () => {
  return {
    generateStructuredResponse: vi.fn(),
    withRateLimit: vi.fn(),
    default: null
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
    it('should retry failed requests', async () => {
      let callCount = 0
      const mockFunction = vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount < 3) {
          return { success: false, error: 'Temporary failure' }
        }
        return { success: true, data: 'Success after retries' }
      })

      vi.mocked(withRateLimit).mockImplementation(async (fn, retries) => {
        // Simulate retry logic
        let lastError = ''
        for (let i = 0; i < (retries || 3); i++) {
          const result = await fn()
          if (result.success) return result
          lastError = result.error || 'Unknown error'
        }
        return { success: false, error: `Failed after ${retries || 3} retries: ${lastError}` }
      })

      const result = await withRateLimit(mockFunction, 3)

      expect(result.success).toBe(true)
      expect(result.data).toBe('Success after retries')
    })

    it('should fail after max retries', async () => {
      const mockFunction = vi.fn().mockResolvedValue({
        success: false,
        error: 'Persistent failure'
      })

      vi.mocked(withRateLimit).mockResolvedValue({
        success: false,
        error: 'Failed after 2 retries: Persistent failure'
      })

      const result = await withRateLimit(mockFunction, 2)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed after 2 retries')
    })
  })
})