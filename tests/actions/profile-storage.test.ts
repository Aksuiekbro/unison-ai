import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { updateJobSeekerProfile, addJobSeekerExperience, addJobSeekerEducation } from '@/app/actions/profile'

// Mock Supabase
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

const mockFetch = vi.fn()
const originalInternalToken = process.env.INTERNAL_API_TOKEN
const originalFetch = globalThis.fetch

describe('Profile Actions with Storage', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ fieldsUpdated: [] }),
      text: async () => ''
    })
    globalThis.fetch = mockFetch as any
    process.env.INTERNAL_API_TOKEN = 'test-internal-token'
    
    mockSupabase = {
      auth: {
        getUser: vi.fn()
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'job_seeker', experiences: [], educations: [] }
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: vi.fn().mockReturnValue({
            data: { publicUrl: 'https://storage.example.com/resume.pdf' }
          })
        })
      }
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  afterAll(() => {
    process.env.INTERNAL_API_TOKEN = originalInternalToken
    globalThis.fetch = originalFetch
  })

  describe('updateJobSeekerProfile', () => {
    it('should update profile without resume upload', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = new FormData()
      formData.append('firstName', 'John')
      formData.append('lastName', 'Doe')
      formData.append('title', 'Software Engineer')
      formData.append('summary', 'Experienced developer')
      formData.append('phone', '555-0123')
      formData.append('location', 'San Francisco, CA')
      formData.append('linkedinUrl', 'https://linkedin.com/in/johndoe')
      formData.append('githubUrl', 'https://github.com/johndoe')
      formData.append('skills', JSON.stringify(['JavaScript', 'React']))

      const result = await updateJobSeekerProfile(formData)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(revalidatePath).toHaveBeenCalledWith('/job-seeker/profile')
    })

    it('should update profile with resume upload', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const resumeFile = new File(['PDF content'], 'resume.pdf', { type: 'application/pdf' })
      
      const formData = new FormData()
      formData.append('firstName', 'John')
      formData.append('lastName', 'Doe')
      formData.append('title', 'Software Engineer')
      formData.append('summary', 'Experienced developer')
      formData.append('phone', '555-0123')
      formData.append('location', 'San Francisco, CA')
      formData.append('linkedinUrl', 'https://linkedin.com/in/johndoe')
      formData.append('githubUrl', 'https://github.com/johndoe')
      formData.append('skills', JSON.stringify(['JavaScript', 'React']))
      formData.append('resume', resumeFile)

      const result = await updateJobSeekerProfile(formData)

      expect(result.success).toBe(true)
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('resumes')
      expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
        expect.stringContaining('user-123/resume-'),
        resumeFile,
        expect.objectContaining({
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf'
        })
      )
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should respect manual resume field selections when auto-apply is disabled', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const resumeFile = new File(['PDF content'], 'resume.pdf', { type: 'application/pdf' })

      const formData = new FormData()
      formData.append('firstName', 'John')
      formData.append('lastName', 'Doe')
      formData.append('title', 'Software Engineer')
      formData.append('summary', 'Experienced developer')
      formData.append('phone', '555-0123')
      formData.append('location', 'San Francisco, CA')
      formData.append('linkedinUrl', 'https://linkedin.com/in/johndoe')
      formData.append('githubUrl', 'https://github.com/johndoe')
      formData.append('skills', JSON.stringify(['JavaScript', 'React']))
      formData.append('resume', resumeFile)
      formData.append('resumeAutoApply', 'false')

      const result = await updateJobSeekerProfile(formData)

      expect(result.success).toBe(true)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle storage upload failure gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock storage failure
      mockSupabase.storage.from().upload.mockResolvedValue({
        error: new Error('Storage quota exceeded')
      })

      const resumeFile = new File(['PDF content'], 'resume.pdf', { type: 'application/pdf' })
      
      const formData = new FormData()
      formData.append('firstName', 'John')
      formData.append('lastName', 'Doe')
      formData.append('title', 'Software Engineer')
      formData.append('summary', 'Experienced developer')
      formData.append('phone', '555-0123')
      formData.append('location', 'San Francisco, CA')
      formData.append('linkedinUrl', '')
      formData.append('githubUrl', '')
      formData.append('skills', JSON.stringify([]))
      formData.append('resume', resumeFile)

      const result = await updateJobSeekerProfile(formData)

      // Should still succeed even if file upload fails
      expect(result.success).toBe(true)
    })

    it('should reject unauthorized users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const formData = new FormData()
      formData.append('firstName', 'John')

      const result = await updateJobSeekerProfile(formData)

      expect(result.error).toBe('Authentication required')
    })

    it('should reject non-job-seekers', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'employer' },
        error: null
      })

      const formData = new FormData()
      formData.append('firstName', 'John')

      const result = await updateJobSeekerProfile(formData)

      expect(result.error).toBe('Job seeker not found')
    })
  })

  describe('addJobSeekerExperience', () => {
    it('should add experience to JSON array', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { 
          role: 'job_seeker',
          experiences: [
            { id: '1', position: 'Junior Dev', company: 'OldCorp' }
          ]
        },
        error: null
      })

      const formData = new FormData()
      formData.append('position', 'Senior Developer')
      formData.append('company', 'TechCorp')
      formData.append('startDate', '2020-01-01')
      formData.append('endDate', '2023-06-01')
      formData.append('description', 'Built web applications')
      formData.append('isCurrent', 'false')

      const result = await addJobSeekerExperience(formData)

      expect(result.success).toBe(true)
      
      // Verify update was called with new experience array
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        experiences: expect.arrayContaining([
          expect.objectContaining({
            position: 'Senior Developer',
            company: 'TechCorp',
            startDate: '2020-01-01',
            endDate: '2023-06-01',
            description: 'Built web applications',
            isCurrent: false
          })
        ])
      })
    })

    it('should handle empty experiences array', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { 
          role: 'job_seeker',
          experiences: null // Empty/null experiences
        },
        error: null
      })

      const formData = new FormData()
      formData.append('position', 'Developer')
      formData.append('company', 'StartupCorp')
      formData.append('startDate', '2023-01-01')
      formData.append('endDate', '')
      formData.append('description', 'Working on various projects')
      formData.append('isCurrent', 'true')

      const result = await addJobSeekerExperience(formData)

      expect(result.success).toBe(true)
      
      // Should create new array with single experience
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        experiences: expect.arrayContaining([
          expect.objectContaining({
            position: 'Developer',
            company: 'StartupCorp',
            isCurrent: true
          })
        ])
      })
    })
  })

  describe('addJobSeekerEducation', () => {
    it('should add education to JSON array', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { 
          role: 'job_seeker',
          educations: []
        },
        error: null
      })

      const formData = new FormData()
      formData.append('institution', 'Stanford University')
      formData.append('degree', 'Bachelor of Science')
      formData.append('fieldOfStudy', 'Computer Science')
      formData.append('graduationYear', '2020')

      const result = await addJobSeekerEducation(formData)

      expect(result.success).toBe(true)
      
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        educations: expect.arrayContaining([
          expect.objectContaining({
            institution: 'Stanford University',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            graduationYear: 2020,
            id: expect.any(String)
          })
        ])
      })
    })

    it('should handle database update errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'job_seeker', educations: [] },
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: new Error('Database connection failed')
      })

      const formData = new FormData()
      formData.append('institution', 'MIT')
      formData.append('degree', 'PhD')
      formData.append('fieldOfStudy', 'AI')
      formData.append('graduationYear', '2025')

      const result = await addJobSeekerEducation(formData)

      expect(result.error).toBe('Failed to add education')
    })

    it('should validate form data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = new FormData()
      formData.append('institution', '') // Invalid empty field
      formData.append('degree', 'Bachelor')
      formData.append('fieldOfStudy', 'CS')
      formData.append('graduationYear', 'invalid-year') // Invalid year

      const result = await addJobSeekerEducation(formData)

      expect(result.error).toBe('Invalid form data')
    })
  })
})
