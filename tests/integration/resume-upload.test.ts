import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// Mock all external dependencies
vi.mock('@/lib/supabase-server')
vi.mock('@/lib/ai/resume-parser')
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn()
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

// Integration test for the complete resume upload flow
describe('Resume Upload Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle complete resume upload flow', async () => {
    // This test simulates the entire flow from file upload to profile update
    
    const mockUser = { id: 'test-user-123' }
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) },
      from: vi.fn().mockReturnValue({
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
                location: null,
                linkedin_url: null,
                github_url: null,
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
    }

    const mockParsedData = {
      personal_info: {
        full_name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-123-4567',
        location: 'New York, NY',
        linkedin_url: 'https://linkedin.com/in/johnsmith',
        github_url: 'https://github.com/johnsmith',
        portfolio_url: 'https://johnsmith.dev'
      },
      professional_summary: 'Senior Software Engineer with 8+ years of experience...',
      experiences: [{
        job_title: 'Senior Software Engineer',
        company_name: 'Tech Innovation Corp',
        start_date: '2020-03',
        end_date: '2023-12',
        is_current: false,
        description: 'Led development of microservices architecture serving 1M+ users',
        achievements: [
          'Reduced API response time by 40%',
          'Mentored team of 5 junior developers',
          'Implemented CI/CD pipeline reducing deployment time by 60%'
        ]
      }, {
        job_title: 'Full Stack Developer',
        company_name: 'Startup Solutions',
        start_date: '2018-01',
        end_date: '2020-02',
        is_current: false,
        description: 'Built and maintained web applications using React and Node.js',
        achievements: [
          'Developed user dashboard increasing engagement by 25%',
          'Optimized database queries improving performance by 30%'
        ]
      }],
      educations: [{
        institution_name: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        start_date: '2014-09',
        end_date: '2018-05',
        is_current: false,
        gpa: '3.8',
        achievements: ['Dean\'s List 3 semesters', 'Computer Science Honor Society']
      }],
      skills: [
        { name: 'JavaScript', category: 'technical', proficiency_level: 5 },
        { name: 'React', category: 'technical', proficiency_level: 5 },
        { name: 'Node.js', category: 'technical', proficiency_level: 4 },
        { name: 'Python', category: 'technical', proficiency_level: 4 },
        { name: 'Leadership', category: 'soft', proficiency_level: 4 },
        { name: 'Problem Solving', category: 'soft', proficiency_level: 5 }
      ],
      languages: [
        { name: 'English', proficiency: 'native' },
        { name: 'Spanish', proficiency: 'intermediate' }
      ],
      certifications: [
        { name: 'AWS Certified Solutions Architect', issuer: 'Amazon', date_obtained: '2022-06' },
        { name: 'Certified Scrum Master', issuer: 'Scrum Alliance', date_obtained: '2021-03' }
      ],
      additional_info: {
        preferred_location: 'Remote',
        remote_preference: true,
        availability: 'Available immediately'
      },
      confidence_scores: {
        overall: 0.92,
        personal_info: 0.95,
        experience: 0.90,
        education: 0.88,
        skills: 0.85
      }
    }

    // Mock the imports
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const { cookies } = await import('next/headers')
    const { parseAndValidateResume } = await import('@/lib/ai/resume-parser')
    const { createClient } = await import('@/lib/supabase-server')

    vi.mocked(createRouteHandlerClient).mockReturnValue(mockSupabase)
    vi.mocked(cookies).mockResolvedValue(new Map())
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(parseAndValidateResume).mockResolvedValue({
      success: true,
      data: mockParsedData,
      confidence: 0.92
    })

    // Import the route handler
    const { POST } = await import('@/app/api/resume/parse/route')

    // Create a realistic PDF file mock with sufficient content
    const pdfContent = Buffer.from('%PDF-1.4\nJohn Smith\nSenior Software Engineer\njohn.smith@example.com\nPhone: +1-555-123-4567\nLocation: New York, NY\nExperience: 8 years in software development with expertise in React, Node.js, and cloud technologies. Led multiple high-impact projects and mentored junior developers.')
    const mockFile = new File([pdfContent], 'john_smith_resume.pdf', { type: 'application/pdf' })

    const formData = new FormData()
    formData.append('resume', mockFile)
    formData.append('auto_apply', 'true')

    const request = new Request('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData,
      headers: {
        'x-auto-apply': 'true'
      }
    })

    // Execute the API
    const response = await POST(request as any)
    const result = await response.json()

    // Verify successful response
    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Resume parsed successfully')
    expect(result.data).toEqual(mockParsedData)

    // Verify AI parsing was called with extracted text
    expect(parseAndValidateResume).toHaveBeenCalledWith(
      expect.stringContaining('John Smith'),
      'john_smith_resume.pdf'
    )

    // Verify database operations
    expect(mockSupabase.from).toHaveBeenCalledWith('resume_parsing_results')
    expect(mockSupabase.from).toHaveBeenCalledWith('users')
    
    // Verify user profile update with parsed data
    expect(mockSupabase.from().update).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'John Smith',
        phone: '+1-555-123-4567',
        location: 'New York, NY',
        linkedin_url: 'https://linkedin.com/in/johnsmith',
        github_url: 'https://github.com/johnsmith',
        portfolio_url: 'https://johnsmith.dev',
        experiences: expect.arrayContaining([
          expect.objectContaining({
            position: 'Senior Software Engineer',
            company: 'Tech Innovation Corp',
            startDate: '2020-03',
            endDate: '2023-12',
            isCurrent: false
          })
        ]),
        educations: expect.arrayContaining([
          expect.objectContaining({
            institution: 'University of California, Berkeley',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            graduationYear: 2018
          })
        ])
      })
    )
  })

  it('should handle file processing errors gracefully', async () => {
    const mockUser = { id: 'test-user-123' }
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) }
    }

    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const { cookies } = await import('next/headers')
    const { parseAndValidateResume } = await import('@/lib/ai/resume-parser')
    const { createClient } = await import('@/lib/supabase-server')

    vi.mocked(createRouteHandlerClient).mockReturnValue(mockSupabase)
    vi.mocked(cookies).mockResolvedValue(new Map())
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(parseAndValidateResume).mockResolvedValue({
      success: false,
      error: 'Unable to extract meaningful content from the resume'
    })

    const { POST } = await import('@/app/api/resume/parse/route')

    // Create corrupted PDF mock with sufficient length but invalid content for AI parsing
    const corruptedPdf = Buffer.from('Not a real PDF file with enough characters to pass the initial text extraction validation but will fail during AI parsing phase due to meaningless content structure and format issues')
    const mockFile = new File([corruptedPdf], 'corrupted.pdf', { type: 'application/pdf' })
    
    const formData = new FormData()
    formData.append('resume', mockFile)

    const request = new Request('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request as any)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unable to extract meaningful content from the resume')
  })

  it('should validate file size limits', async () => {
    const mockUser = { id: 'test-user-123' }
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) }
    }

    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const { cookies } = await import('next/headers')
    const { createClient } = await import('@/lib/supabase-server')

    vi.mocked(createRouteHandlerClient).mockReturnValue(mockSupabase)
    vi.mocked(cookies).mockResolvedValue(new Map())
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const { POST } = await import('@/app/api/resume/parse/route')

    // Create file larger than 10MB limit
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'x')
    const mockFile = new File([largeBuffer], 'large_resume.pdf', { type: 'application/pdf' })
    
    const formData = new FormData()
    formData.append('resume', mockFile)

    const request = new Request('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request as any)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('File too large. Maximum size is 10MB')
  })

  it('should validate supported file types', async () => {
    const mockUser = { id: 'test-user-123' }
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) }
    }

    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
    const { cookies } = await import('next/headers')
    const { createClient } = await import('@/lib/supabase-server')

    vi.mocked(createRouteHandlerClient).mockReturnValue(mockSupabase)
    vi.mocked(cookies).mockResolvedValue(new Map())
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const { POST } = await import('@/app/api/resume/parse/route')

    // Test unsupported file type
    const textFile = Buffer.from('This is a text resume')
    const mockFile = new File([textFile], 'resume.txt', { type: 'text/plain' })
    
    const formData = new FormData()
    formData.append('resume', mockFile)

    const request = new Request('http://localhost/api/resume/parse', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request as any)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid file type. Please upload PDF or Word document')
  })
})