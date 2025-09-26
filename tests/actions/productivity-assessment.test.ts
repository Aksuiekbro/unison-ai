import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  submitProductivityAssessment,
  checkProductivityAssessmentStatus,
  getProductivityAssessmentData
} from '@/actions/productivity-assessment'

// Mock Supabase
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn()
}))

import { createClient } from '@/lib/supabase-server'
vi.mock('@/lib/ai/productivity-scorer', () => ({
  scoreProductivity: vi.fn()
}))
import { scoreProductivity } from '@/lib/ai/productivity-scorer'

describe('Productivity Assessment Actions', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn()
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { productivity_assessment_completed: false }
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' } // No rows returned
                })
              })
            })
          })
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  describe('submitProductivityAssessment', () => {
    const createValidFormData = () => {
      const formData = new FormData()

      // Work experience
      formData.append('work_experience_0_company_name', 'TechCorp Inc.')
      formData.append('work_experience_0_company_activities', 'Software development')
      formData.append('work_experience_0_position', 'Software Engineer')
      formData.append('work_experience_0_start_date', '2020-01-01')
      formData.append('work_experience_0_end_date', '2023-06-01')
      formData.append('work_experience_0_is_current', 'false')
      formData.append('work_experience_0_work_duration', '3 years 5 months')
      formData.append('work_experience_0_reason_for_leaving', 'Career growth')
      formData.append('work_experience_0_functions_performed', 'Full-stack development')
      formData.append('work_experience_0_work_products', 'Web applications and APIs')
      formData.append('work_experience_0_result_measurement', 'Code quality metrics and user satisfaction')
      formData.append('work_experience_0_product_timeline', 'Quarterly releases')
      formData.append('work_experience_0_team_comparison_score', '4')
      formData.append('work_experience_0_workload_change_over_time', 'Increased responsibility')
      formData.append('work_experience_0_responsibility_evolution', 'From junior to mid-level')
      formData.append('work_experience_0_key_achievements', 'Led migration to microservices')

      // Knowledge assessment
      formData.append('recent_learning_activities', 'Completed React certification')
      formData.append('professional_development', 'Attended tech conferences')
      formData.append('future_learning_goals', 'Learn machine learning')

      // Personal information
      formData.append('citizenship', 'Kazakhstan')
      formData.append('residence_location', 'Almaty')
      formData.append('family_status', 'Single')
      formData.append('has_children', 'false')
      formData.append('living_situation', 'Renting apartment')
      formData.append('actual_address', '123 Main St, Almaty')
      formData.append('financial_obligations', 'Student loan')
      formData.append('legal_issues', 'None')
      formData.append('chronic_illnesses', 'None')
      formData.append('minimum_salary_requirement', '500000')

      // Assessment scores
      formData.append('role_type', 'specialist')
      formData.append('motivation_level', '3')
      formData.append('iq_test_score', '120')
      formData.append('personality_test_score', '85')
      formData.append('leadership_test_score', '75')
      formData.append('overall_productivity_score', '82')
      formData.append('assessor_notes', 'Strong technical skills')
      formData.append('probation_recommendation', 'yes')
      formData.append('planned_start_date', '2024-01-15')

      return formData
    }

    it('should successfully submit valid productivity assessment', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = createValidFormData()
      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Productivity assessment completed successfully!')

      // Verify database operations
      expect(mockSupabase.from).toHaveBeenCalledWith('work_experiences')
      expect(mockSupabase.from).toHaveBeenCalledWith('knowledge_assessments')
      expect(mockSupabase.from).toHaveBeenCalledWith('productivity_assessments')
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should use Gemini to compute score when not provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      vi.mocked(scoreProductivity).mockResolvedValue({
        success: true,
        data: {
          overall_productivity_score: 76,
          probation_recommendation: 'yes',
          assessor_notes: 'Consistent output and responsibility growth observed.',
          confidence_score: 0.86
        }
      } as any)

      const formData = new FormData()
      // Minimal required work experience
      formData.append('work_experience_0_company_name', 'GeminiCorp')
      formData.append('work_experience_0_position', 'Engineer')
      formData.append('work_experience_0_start_date', '2023-01-01')
      // No overall_productivity_score provided

      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(true)
      // Verify AI scorer was called
      expect(scoreProductivity).toHaveBeenCalled()

      // Verify insert used AI-computed score
      const insertArgs = mockSupabase.from().insert.mock.calls.find(call => Array.isArray(call) && call[0] && call[0].user_id)
      // When using mockReturnValue above, insert is shared across tables; assert via last call into productivity_assessments
      expect(mockSupabase.from).toHaveBeenCalledWith('productivity_assessments')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-123',
        overall_productivity_score: 76,
        probation_recommendation: 'yes',
        assessor_notes: expect.stringContaining('Consistent output')
      }))
    })

    it('should continue without AI if Gemini scoring fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      vi.mocked(scoreProductivity).mockResolvedValue({
        success: false,
        error: 'Gemini not configured'
      } as any)

      const formData = new FormData()
      formData.append('work_experience_0_company_name', 'NoAI Co')
      formData.append('work_experience_0_position', 'Dev')
      formData.append('work_experience_0_start_date', '2023-01-01')
      // No overall_productivity_score provided

      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(true)
      // Ensure we attempted AI
      expect(scoreProductivity).toHaveBeenCalled()
      // But insert proceeds with null score
      expect(mockSupabase.from).toHaveBeenCalledWith('productivity_assessments')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-123',
        overall_productivity_score: undefined
      }))
    })

    it('should handle multiple work experiences', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = createValidFormData()

      // Add second work experience
      formData.append('work_experience_1_company_name', 'StartupCorp')
      formData.append('work_experience_1_position', 'Senior Developer')
      formData.append('work_experience_1_start_date', '2023-07-01')
      formData.append('work_experience_1_is_current', 'true')

      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(true)

      // Verify work experiences insert was called with array of 2 experiences
      const insertCall = mockSupabase.from().insert
      expect(insertCall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'user-123',
            company_name: 'TechCorp Inc.',
            position: 'Software Engineer'
          }),
          expect.objectContaining({
            user_id: 'user-123',
            company_name: 'StartupCorp',
            position: 'Senior Developer'
          })
        ])
      )
    })

    it('should reject submission without authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const formData = createValidFormData()
      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not authenticated')
    })

    it('should validate required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = new FormData()
      // Missing required work experience fields
      formData.append('recent_learning_activities', 'Some learning')

      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid form data')
      expect(result.errors).toBeDefined()
    })

    it('should handle work experience insertion errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock work experience insertion error
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'work_experiences') {
          return {
            insert: vi.fn().mockResolvedValue({
              error: new Error('Database constraint violation')
            })
          }
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { productivity_assessment_completed: false }
              })
            })
          })
        }
      })

      const formData = createValidFormData()
      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to save work experiences')
    })

    it('should handle knowledge assessment insertion errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock knowledge assessment insertion error
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'knowledge_assessments') {
          return {
            insert: vi.fn().mockResolvedValue({
              error: new Error('Database error')
            })
          }
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { productivity_assessment_completed: false }
              })
            })
          })
        }
      })

      const formData = createValidFormData()
      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to save knowledge assessment')
    })

    it('should handle productivity assessment insertion errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock productivity assessment insertion error
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'productivity_assessments') {
          return {
            insert: vi.fn().mockResolvedValue({
              error: new Error('Assessment already exists')
            })
          }
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { productivity_assessment_completed: false }
              })
            })
          })
        }
      })

      const formData = createValidFormData()
      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to save productivity assessment')
    })

    it('should handle user completion status update errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock user update error
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: new Error('User update failed')
              })
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { productivity_assessment_completed: false }
                })
              })
            })
          }
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null })
        }
      })

      const formData = createValidFormData()
      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to update assessment completion status')
    })

    it('should parse optional fields correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = new FormData()

      // Minimal required data
      formData.append('work_experience_0_company_name', 'MinimalCorp')
      formData.append('work_experience_0_position', 'Developer')
      formData.append('work_experience_0_start_date', '2023-01-01')

      // No optional fields provided

      const result = await submitProductivityAssessment({}, formData)

      expect(result.success).toBe(true)
    })
  })

  describe('checkProductivityAssessmentStatus', () => {
    it('should return completion status for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { productivity_assessment_completed: true },
        error: null
      })

      const result = await checkProductivityAssessmentStatus()

      expect(result.success).toBe(true)
      expect(result.completed).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should return false for non-completed assessment', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { productivity_assessment_completed: false },
        error: null
      })

      const result = await checkProductivityAssessmentStatus()

      expect(result.success).toBe(true)
      expect(result.completed).toBe(false)
    })

    it('should handle null completion status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { productivity_assessment_completed: null },
        error: null
      })

      const result = await checkProductivityAssessmentStatus()

      expect(result.success).toBe(true)
      expect(result.completed).toBe(false)
    })

    it('should reject unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const result = await checkProductivityAssessmentStatus()

      expect(result.success).toBe(false)
      expect(result.completed).toBe(false)
      expect(result.message).toBe('User not authenticated')
    })

    it('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const result = await checkProductivityAssessmentStatus()

      expect(result.success).toBe(false)
      expect(result.completed).toBe(false)
      expect(result.message).toBe('Failed to check assessment status')
    })
  })

  describe('getProductivityAssessmentData', () => {
    it('should return complete assessment data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const mockWorkExperiences = [
        {
          id: '1',
          user_id: 'user-123',
          company_name: 'TechCorp',
          position: 'Developer',
          start_date: '2020-01-01'
        }
      ]

      const mockKnowledgeAssessment = {
        id: '1',
        user_id: 'user-123',
        recent_learning_activities: 'React course',
        professional_development: 'Conferences'
      }

      const mockProductivityAssessment = {
        id: '1',
        user_id: 'user-123',
        overall_productivity_score: 85,
        motivation_level: 3
      }

      // Mock different responses for different tables
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'work_experiences') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockWorkExperiences,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'knowledge_assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockKnowledgeAssessment,
                      error: null
                    })
                  })
                })
              })
            })
          }
        }
        if (table === 'productivity_assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockProductivityAssessment,
                      error: null
                    })
                  })
                })
              })
            })
          }
        }
        return mockSupabase.from()
      })

      const result = await getProductivityAssessmentData()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        workExperiences: mockWorkExperiences,
        knowledgeAssessment: mockKnowledgeAssessment,
        productivityAssessment: mockProductivityAssessment
      })
    })

    it('should handle missing knowledge assessment', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'work_experiences') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          }
        }
        if (table === 'knowledge_assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' } // No rows returned
                    })
                  })
                })
              })
            })
          }
        }
        if (table === 'productivity_assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' }
                    })
                  })
                })
              })
            })
          }
        }
        return mockSupabase.from()
      })

      const result = await getProductivityAssessmentData()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        workExperiences: [],
        knowledgeAssessment: null,
        productivityAssessment: null
      })
    })

    it('should reject unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const result = await getProductivityAssessmentData()

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not authenticated')
      expect(result.data).toBe(null)
    })

    it('should handle work experiences fetch errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'work_experiences') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: new Error('Database error')
                })
              })
            })
          }
        }
        return mockSupabase.from()
      })

      const result = await getProductivityAssessmentData()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to fetch work experiences')
      expect(result.data).toBe(null)
    })

    it('should handle knowledge assessment fetch errors (non-PGRST116)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'work_experiences') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          }
        }
        if (table === 'knowledge_assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: new Error('Connection timeout')
                    })
                  })
                })
              })
            })
          }
        }
        if (table === 'productivity_assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' }
                    })
                  })
                })
              })
            })
          }
        }
        return mockSupabase.from()
      })

      // Should still succeed but log the error
      const result = await getProductivityAssessmentData()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        workExperiences: [],
        knowledgeAssessment: null,
        productivityAssessment: null
      })
    })
  })
})