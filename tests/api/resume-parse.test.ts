import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/resume/parse/route'

// Mock dependencies
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

vi.mock('@/lib/ai/resume-parser', () => ({
  parseAndValidateResume: vi.fn()
}))

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { parseAndValidateResume } from '@/lib/ai/resume-parser'

describe('Resume Parse API Route', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSupabase = {
      auth: {
        getUser: vi.fn()
      },
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { full_name: null, phone: null, experiences: null, educations: null }
            })
          })
        })
      })
    }

    vi.mocked(createRouteHandlerClient).mockReturnValue(mockSupabase)
    vi.mocked(cookies).mockResolvedValue(new Map())
  })

  it('should successfully process PDF resume', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    // Mock AI parsing result
    vi.mocked(parseAndValidateResume).mockResolvedValue({
      success: true,
      data: {
        personal_info: {
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          location: 'New York, NY',
          linkedin_url: 'https://linkedin.com/in/johndoe'
        },
        professional_summary: 'Software engineer with 5 years experience',
        experience: [{
          job_title: 'Senior Developer',
          company_name: 'Tech Corp',
          start_date: '2020-01',
          end_date: '2023-06',
          is_current: false,
          description: 'Built web applications',
          achievements: []
        }],
        education: [{
          institution_name: 'MIT',
          degree: 'Computer Science',
          field_of_study: 'BS',
          start_date: '2016-09',
          end_date: '2020-06',
          is_current: false,
          achievements: []
        }],
        skills: [],
        languages: [],
        certifications: [],
        additional_info: {},
        confidence_scores: {
          overall: 0.85,
          personal_info: 0.9,
          experience: 0.8,
          education: 0.85,
          skills: 0.7
        }
      },
      confidence: 0.85
    })

    // Create mock PDF file with sufficient content
    const pdfContent = 'Mock PDF content with sufficient text to pass the 100 character minimum requirement for text extraction in the resume parsing API route. This is a detailed resume with enough content for processing.'
    const pdfBuffer = Buffer.from(pdfContent)
    const mockFile = new File([pdfBuffer], 'resume.pdf', { type: 'application/pdf' })
    
    const formData = new FormData()
    formData.append('resume', mockFile)

    const request = new NextRequest('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Resume parsed successfully')
    expect(parseAndValidateResume).toHaveBeenCalledWith(
      expect.any(String),
      'resume.pdf'
    )
  })

  it('should reject unauthenticated requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated')
    })

    const formData = new FormData()
    formData.append('resume', new File([''], 'resume.pdf'))

    const request = new NextRequest('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(401)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('should reject requests without file', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    const formData = new FormData()
    // No file added

    const request = new NextRequest('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('No file provided')
  })

  it('should reject files that are too large', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    // Create file larger than 10MB
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024)
    const mockFile = new File([largeBuffer], 'large-resume.pdf', { type: 'application/pdf' })
    
    const formData = new FormData()
    formData.append('resume', mockFile)

    const request = new NextRequest('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('File too large. Maximum size is 10MB')
  })

  it('should reject invalid file types', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    const mockFile = new File(['content'], 'resume.txt', { type: 'text/plain' })
    
    const formData = new FormData()
    formData.append('resume', mockFile)

    const request = new NextRequest('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid file type. Please upload PDF or Word document')
  })

  it('should handle AI parsing failures', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    vi.mocked(parseAndValidateResume).mockResolvedValue({
      success: false,
      error: 'Failed to parse resume content'
    })

    const pdfContent = 'PDF content with sufficient text to pass the 100 character minimum requirement for text extraction processing with enough details for AI parsing'
    const mockFile = new File([pdfContent], 'resume.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('resume', mockFile)

    const request = new NextRequest('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to parse resume content')
  })

  it('should handle insufficient text extraction', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    // Mock file with very little extractable text
    const shortBuffer = Buffer.from('short')
    const mockFile = new File([shortBuffer], 'resume.pdf', { type: 'application/pdf' })
    
    const formData = new FormData()
    formData.append('resume', mockFile)

    const request = new NextRequest('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Could not extract enough text from the resume. Please try a different format.')
  })

  it('should update user profile with parsed data', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    // Mock existing user with empty fields
    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { 
              full_name: null, 
              phone: null,
              experiences: [],
              educations: []
            }
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    })

    vi.mocked(parseAndValidateResume).mockResolvedValue({
      success: true,
      data: {
        personal_info: {
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-0123',
          location: 'San Francisco, CA'
        },
        experiences: [{
          job_title: 'Product Manager',
          company_name: 'StartupCorp',
          start_date: '2019-01',
          end_date: null,
          is_current: true,
          description: 'Led product development'
        }],
        educations: [{
          institution_name: 'Stanford',
          degree: 'MBA',
          field_of_study: 'Business',
          graduation_year: 2017
        }],
        professional_summary: 'Product manager',
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
    })

    const pdfContent = 'PDF content with sufficient text to pass the 100 character minimum requirement for text extraction processing with enough details for AI parsing and profile updates'
    const mockFile = new File([pdfContent], 'resume.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('resume', mockFile)

    const request = new NextRequest('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    
    // Verify user update was called
    expect(mockSupabase.from).toHaveBeenCalledWith('users')
  })
})