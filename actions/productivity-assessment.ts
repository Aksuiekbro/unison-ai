"use server"

import { z } from "zod"
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { scoreProductivity } from '@/lib/ai/productivity-scorer'

// Validation schemas
const workExperienceSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_activities: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  is_current: z.boolean().default(false),
  work_duration: z.string().optional(),
  reason_for_leaving: z.string().optional(),
  functions_performed: z.string().optional(),
  work_products: z.string().optional(),
  result_measurement: z.string().optional(),
  product_timeline: z.string().optional(),
  team_comparison_score: z.number().min(1).max(5).optional(),
  workload_change_over_time: z.string().optional(),
  responsibility_evolution: z.string().optional(),
  key_achievements: z.string().optional(),
})

const knowledgeAssessmentSchema = z.object({
  recent_learning_activities: z.string().optional(),
  professional_development: z.string().optional(),
  future_learning_goals: z.string().optional(),
})

const productivityAssessmentSchema = z.object({
  // Personal Information
  citizenship: z.string().optional(),
  residence_location: z.string().optional(),
  family_status: z.string().optional(),
  has_children: z.boolean().optional(),
  living_situation: z.string().optional(),
  actual_address: z.string().optional(),
  financial_obligations: z.string().optional(),
  legal_issues: z.string().optional(),
  chronic_illnesses: z.string().optional(),
  minimum_salary_requirement: z.number().optional(),

  // Assessment Scores
  role_type: z.enum(['manager', 'specialist']).optional(),
  motivation_level: z.number().min(1).max(4).optional(),
  iq_test_score: z.number().optional(),
  personality_test_score: z.number().optional(),
  leadership_test_score: z.number().optional(),

  // Assessment Conclusion
  overall_productivity_score: z.number().min(0).max(100).optional(),
  assessor_notes: z.string().optional(),
  probation_recommendation: z.enum(['yes', 'no', 'never_consider']).optional(),
  planned_start_date: z.string().optional(),

  // Work experiences and knowledge assessment
  work_experiences: z.array(workExperienceSchema).min(1, "At least one work experience is required"),
  knowledge_assessment: knowledgeAssessmentSchema,
})

export async function submitProductivityAssessment(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: "User not authenticated",
      }
    }

    // Parse form data
    const data = Object.fromEntries(formData)

    // Parse work experiences (expecting multiple entries)
    const workExperiences = []
    let experienceIndex = 0

    while (data[`work_experience_${experienceIndex}_company_name`]) {
      const experience = {
        company_name: data[`work_experience_${experienceIndex}_company_name`] as string,
        company_activities: data[`work_experience_${experienceIndex}_company_activities`] as string || undefined,
        position: data[`work_experience_${experienceIndex}_position`] as string,
        start_date: data[`work_experience_${experienceIndex}_start_date`] as string,
        end_date: data[`work_experience_${experienceIndex}_end_date`] as string || undefined,
        is_current: data[`work_experience_${experienceIndex}_is_current`] === 'true',
        work_duration: data[`work_experience_${experienceIndex}_work_duration`] as string || undefined,
        reason_for_leaving: data[`work_experience_${experienceIndex}_reason_for_leaving`] as string || undefined,
        functions_performed: data[`work_experience_${experienceIndex}_functions_performed`] as string || undefined,
        work_products: data[`work_experience_${experienceIndex}_work_products`] as string || undefined,
        result_measurement: data[`work_experience_${experienceIndex}_result_measurement`] as string || undefined,
        product_timeline: data[`work_experience_${experienceIndex}_product_timeline`] as string || undefined,
        team_comparison_score: data[`work_experience_${experienceIndex}_team_comparison_score`]
          ? parseInt(data[`work_experience_${experienceIndex}_team_comparison_score`] as string)
          : undefined,
        workload_change_over_time: data[`work_experience_${experienceIndex}_workload_change_over_time`] as string || undefined,
        responsibility_evolution: data[`work_experience_${experienceIndex}_responsibility_evolution`] as string || undefined,
        key_achievements: data[`work_experience_${experienceIndex}_key_achievements`] as string || undefined,
      }
      workExperiences.push(experience)
      experienceIndex++
    }

    // Parse knowledge assessment
    const knowledgeAssessment = {
      recent_learning_activities: data.recent_learning_activities as string || undefined,
      professional_development: data.professional_development as string || undefined,
      future_learning_goals: data.future_learning_goals as string || undefined,
    }

    // Parse main assessment data
    const assessmentData = {
      citizenship: data.citizenship as string || undefined,
      residence_location: data.residence_location as string || undefined,
      family_status: data.family_status as string || undefined,
      has_children: data.has_children === 'true' || undefined,
      living_situation: data.living_situation as string || undefined,
      actual_address: data.actual_address as string || undefined,
      financial_obligations: data.financial_obligations as string || undefined,
      legal_issues: data.legal_issues as string || undefined,
      chronic_illnesses: data.chronic_illnesses as string || undefined,
      minimum_salary_requirement: data.minimum_salary_requirement ? parseInt(data.minimum_salary_requirement as string) : undefined,
      role_type: data.role_type as 'manager' | 'specialist' || undefined,
      motivation_level: data.motivation_level ? parseInt(data.motivation_level as string) : undefined,
      iq_test_score: data.iq_test_score ? parseInt(data.iq_test_score as string) : undefined,
      personality_test_score: data.personality_test_score ? parseInt(data.personality_test_score as string) : undefined,
      leadership_test_score: data.leadership_test_score ? parseInt(data.leadership_test_score as string) : undefined,
      overall_productivity_score: data.overall_productivity_score ? parseInt(data.overall_productivity_score as string) : undefined,
      assessor_notes: data.assessor_notes as string || undefined,
      probation_recommendation: data.probation_recommendation as 'yes' | 'no' | 'never_consider' || undefined,
      planned_start_date: data.planned_start_date as string || undefined,
      work_experiences: workExperiences,
      knowledge_assessment: knowledgeAssessment,
    }

    // Validate the parsed data
    const parsed = productivityAssessmentSchema.safeParse(assessmentData)

    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid form data",
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    // Optionally enrich with AI-computed scores if not provided
    let enriched = parsed.data
    try {
      const hasManualScore = typeof parsed.data.overall_productivity_score === 'number'
      if (!hasManualScore) {
        const ai = await scoreProductivity({
          work_experiences: parsed.data.work_experiences,
          knowledge_assessment: parsed.data.knowledge_assessment,
          personal_info: {
            role_type: parsed.data.role_type,
            motivation_level: parsed.data.motivation_level,
            minimum_salary_requirement: parsed.data.minimum_salary_requirement,
            residence_location: parsed.data.residence_location,
          },
        })
        if (ai.success && ai.data) {
          enriched = {
            ...parsed.data,
            overall_productivity_score: ai.data.overall_productivity_score,
            assessor_notes: parsed.data.assessor_notes || ai.data.assessor_notes,
            probation_recommendation: parsed.data.probation_recommendation || ai.data.probation_recommendation,
          }
        }
      }
    } catch (_) {
      // Non-fatal: if AI fails, continue with provided data
    }

    // Ensure a users row exists for FK constraints (self-insert allowed by RLS)
    try {
      const { data: existingUserRow, error: existingUserErr } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingUserRow) {
        const rawRole = (user.user_metadata as any)?.role
        const role = (rawRole === 'employee' || rawRole === 'job-seeker') ? 'job_seeker' : (rawRole || 'job_seeker')
        const email = user.email || ''
        const fullName = (user.user_metadata as any)?.full_name || (email.split('@')[0] || 'User')
        const { error: insertUserErr } = await supabase
          .from('users')
          .insert({ id: user.id, email, full_name: fullName, role })
        if (insertUserErr) {
          console.error('Error ensuring users row exists:', insertUserErr)
        }
      }
    } catch (ensureErr) {
      console.warn('Non-fatal: failed to ensure users row exists', ensureErr)
    }

    // Start transaction to save all data
    // Save work experiences
    const { error: workExpError } = await supabase
      .from('work_experiences')
      .insert(
        parsed.data.work_experiences.map(exp => ({
          user_id: user.id,
          ...exp
        }))
      )

    if (workExpError) {
      console.error('Error saving work experiences:', workExpError)
      return {
        success: false,
        message: "Failed to save work experiences",
      }
    }

    // Save knowledge assessment
    const { error: knowledgeError } = await supabase
      .from('knowledge_assessments')
      .insert({
        user_id: user.id,
        ...parsed.data.knowledge_assessment
      })

    if (knowledgeError) {
      console.error('Error saving knowledge assessment:', knowledgeError)
      return {
        success: false,
        message: "Failed to save knowledge assessment",
      }
    }

    // Save productivity assessment
    const { error: assessmentError } = await supabase
      .from('productivity_assessments')
      .insert({
        user_id: user.id,
        citizenship: enriched.citizenship,
        residence_location: enriched.residence_location,
        family_status: enriched.family_status,
        has_children: enriched.has_children,
        living_situation: enriched.living_situation,
        actual_address: enriched.actual_address,
        financial_obligations: enriched.financial_obligations,
        legal_issues: enriched.legal_issues,
        chronic_illnesses: enriched.chronic_illnesses,
        minimum_salary_requirement: enriched.minimum_salary_requirement,
        role_type: enriched.role_type,
        motivation_level: enriched.motivation_level,
        iq_test_score: enriched.iq_test_score,
        personality_test_score: enriched.personality_test_score,
        leadership_test_score: enriched.leadership_test_score,
        overall_productivity_score: enriched.overall_productivity_score,
        assessor_notes: enriched.assessor_notes,
        probation_recommendation: enriched.probation_recommendation,
        planned_start_date: enriched.planned_start_date,
        assessment_version: 'v1.0',
      })

    if (assessmentError) {
      console.error('Error saving productivity assessment:', assessmentError)
      return {
        success: false,
        message: "Failed to save productivity assessment",
      }
    }

    // Mark assessment as completed
    const { error: updateError } = await supabase
      .from('users')
      .update({ productivity_assessment_completed: true })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating assessment completion status:', updateError)
      return {
        success: false,
        message: "Failed to update assessment completion status",
      }
    }

    return {
      success: true,
      message: "Productivity assessment completed successfully!",
    }
  } catch (error: any) {
    console.error('Assessment submission error:', error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    }
  }
}

export async function checkProductivityAssessmentStatus() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        completed: false,
        message: "User not authenticated",
      }
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('productivity_assessment_completed')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking assessment status:', error)
      return {
        success: false,
        completed: false,
        message: "Failed to check assessment status",
      }
    }

    return {
      success: true,
      completed: userData?.productivity_assessment_completed || false,
    }
  } catch (error: any) {
    console.error('Error checking assessment status:', error)
    return {
      success: false,
      completed: false,
      message: error.message || "An unexpected error occurred",
    }
  }
}

export async function getProductivityAssessmentData() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: "User not authenticated",
        data: null,
      }
    }

    // Get work experiences
    const { data: workExperiences, error: workExpError } = await supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })

    if (workExpError) {
      console.error('Error fetching work experiences:', workExpError)
      return {
        success: false,
        message: "Failed to fetch work experiences",
        data: null,
      }
    }

    // Get knowledge assessment
    const { data: knowledgeAssessment, error: knowledgeError } = await supabase
      .from('knowledge_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (knowledgeError && knowledgeError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching knowledge assessment:', knowledgeError)
    }

    // Get productivity assessment
    const { data: productivityAssessment, error: assessmentError } = await supabase
      .from('productivity_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (assessmentError && assessmentError.code !== 'PGRST116') {
      console.error('Error fetching productivity assessment:', assessmentError)
    }

    return {
      success: true,
      data: {
        workExperiences: workExperiences || [],
        knowledgeAssessment: knowledgeAssessment || null,
        productivityAssessment: productivityAssessment || null,
      },
    }
  } catch (error: any) {
    console.error('Error fetching assessment data:', error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
      data: null,
    }
  }
}