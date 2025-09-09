import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseAndValidateResume, parseResumeWithAI } from '@/lib/ai/resume-parser'

// Mock Gemini AI
vi.mock('@/lib/ai/gemini', () => ({
  withRateLimit: vi.fn(),
  generateStructuredResponse: vi.fn()
}))

import { withRateLimit, generateStructuredResponse } from '@/lib/ai/gemini'

describe('Resume Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseResumeWithAI', () => {
    it('should successfully parse resume text', async () => {
      const mockResult = {
        success: true,
        data: {
          personal_info: {
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            location: 'New York, NY',
            linkedin_url: 'https://linkedin.com/in/johndoe',
            github_url: 'https://github.com/johndoe'
          },
          professional_summary: 'Experienced software engineer...',
          experience: [{
            job_title: 'Senior Developer',
            company_name: 'Tech Corp',
            start_date: '2020-01',
            end_date: '2023-06',
            is_current: false,
            description: 'Developed web applications',
            achievements: ['Increased performance by 30%']
          }],
          education: [{
            institution_name: 'MIT',
            degree: 'Bachelor of Science',
            field_of_study: 'Computer Science',
            start_date: '2016-09',
            end_date: '2020-06',
            is_current: false,
            achievements: ['Magna Cum Laude']
          }],
          skills: [{
            name: 'JavaScript',
            category: 'technical',
            proficiency_level: 5
          }],
          languages: [{
            name: 'English',
            proficiency: 'native'
          }],
          certifications: [{
            name: 'AWS Certified',
            issuer: 'Amazon',
            date_obtained: '2022-03'
          }],
          additional_info: {
            preferred_location: 'Remote',
            remote_preference: true
          },
          confidence_scores: {
            overall: 0.9,
            personal_info: 0.95,
            experience: 0.85,
            education: 0.9,
            skills: 0.8
          }
        },
        confidence: 0.9
      }

      vi.mocked(withRateLimit).mockResolvedValue(mockResult)

      const resumeText = 'John Doe\nSoftware Engineer\njohn@example.com\n...'
      const result = await parseResumeWithAI(resumeText, 'john-resume.pdf')

      expect(withRateLimit).toHaveBeenCalledWith(expect.any(Function))
      expect(result).toEqual(mockResult)
    })

    it('should handle AI parsing failure', async () => {
      const mockError = {
        success: false,
        error: 'AI service unavailable'
      }

      vi.mocked(withRateLimit).mockResolvedValue(mockError)

      const resumeText = 'Invalid resume text'
      const result = await parseResumeWithAI(resumeText)

      expect(result.success).toBe(false)
      expect(result.error).toBe('AI service unavailable')
    })
  })

  describe('parseAndValidateResume', () => {
    it('should validate and clean parsed resume data', async () => {
      const mockAIResult = {
        success: true,
        data: {
          personal_info: {
            full_name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '555-0123',
            location: 'San Francisco, CA'
          },
          professional_summary: 'Product manager with 5 years experience',
          experience: [{
            job_title: 'Product Manager',
            company_name: 'StartupCorp',
            start_date: '2019-01',
            end_date: null, // Should set is_current to true
            is_current: false,
            description: 'Led product development',
            achievements: []
          }],
          education: [{
            institution_name: 'Stanford',
            degree: 'MBA',
            field_of_study: 'Business',
            start_date: '2015-09',
            end_date: '2017-06',
            is_current: false
          }],
          skills: [],
          languages: [],
          certifications: [],
          additional_info: {},
          confidence_scores: {
            overall: 0.8,
            personal_info: 0.9,
            experience: 0.7,
            education: 0.8,
            skills: 0.6
          }
        },
        confidence: 0.8
      }

      vi.mocked(withRateLimit).mockResolvedValue(mockAIResult)

      const result = await parseAndValidateResume('resume text')

      expect(result.success).toBe(true)
      expect(result.data?.experience[0].is_current).toBe(true) // Should be set to true when end_date is null
      expect(result.data?.experience[0].achievements).toEqual([]) // Should have empty array
    })

    it('should reject resume with missing required fields', async () => {
      const mockAIResult = {
        success: true,
        data: {
          personal_info: {
            full_name: '', // Missing required field
            email: 'invalid-email', // Invalid email
            phone: '555-0123',
            location: 'San Francisco, CA'
          },
          professional_summary: '',
          experience: [],
          education: [],
          skills: [],
          languages: [],
          certifications: [],
          additional_info: {},
          confidence_scores: {
            overall: 0.8,
            personal_info: 0.9,
            experience: 0.7,
            education: 0.8,
            skills: 0.6
          }
        }
      }

      vi.mocked(withRateLimit).mockResolvedValue(mockAIResult)

      const result = await parseAndValidateResume('bad resume text')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Missing required personal information')
    })

    it('should reject resume with invalid email format', async () => {
      const mockAIResult = {
        success: true,
        data: {
          personal_info: {
            full_name: 'John Doe',
            email: 'invalid-email-format',
            phone: '555-0123',
            location: 'San Francisco, CA'
          },
          professional_summary: '',
          experience: [],
          education: [],
          skills: [],
          languages: [],
          certifications: [],
          additional_info: {},
          confidence_scores: {
            overall: 0.8,
            personal_info: 0.9,
            experience: 0.7,
            education: 0.8,
            skills: 0.6
          }
        }
      }

      vi.mocked(withRateLimit).mockResolvedValue(mockAIResult)

      const result = await parseAndValidateResume('resume with bad email')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email format detected')
    })

    it('should set default confidence scores when missing', async () => {
      const mockAIResult = {
        success: true,
        data: {
          personal_info: {
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '555-0123',
            location: 'San Francisco, CA'
          },
          professional_summary: '',
          experience: [],
          education: [],
          skills: [],
          languages: [],
          certifications: [],
          additional_info: {}
          // Missing confidence_scores
        }
      }

      vi.mocked(withRateLimit).mockResolvedValue(mockAIResult)

      const result = await parseAndValidateResume('resume text')

      expect(result.success).toBe(true)
      expect(result.data?.confidence_scores).toEqual({
        overall: 0.7,
        personal_info: 0.8,
        experience: 0.7,
        education: 0.7,
        skills: 0.6
      })
    })
  })
})