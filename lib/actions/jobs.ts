'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'

export type JobStatus = 'draft' | 'published' | 'closed' | 'cancelled'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship'
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'executive'

export interface Job {
  id: string
  title: string
  description: string
  requirements: string | null
  responsibilities: string | null
  company_id: string
  job_type: JobType
  experience_level: ExperienceLevel
  salary_min: number | null
  salary_max: number | null
  currency: string
  location: string | null
  remote_allowed: boolean
  status: JobStatus
  posted_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

type MatchScoreRow = Database['public']['Tables']['match_scores']['Row']
type PersonalityAnalysisRow = Database['public']['Tables']['personality_analysis']['Row']

export interface Application {
  id: string
  job_id: string
  applicant_id: string
  status:
    | 'pending'
    | 'reviewing'
    | 'interview'
    | 'interviewed'
    | 'offered'
    | 'hired'
    | 'accepted'
    | 'rejected'
  cover_letter: string | null
  resume_url: string | null
  notes: string | null
  applied_at: string
  updated_at: string
  applicant: {
    id: string
    full_name: string
    email: string
    phone: string | null
    location: string | null
    bio: string | null
    current_job_title?: string | null
    linkedin_url?: string | null
    github_url?: string | null
    portfolio_url?: string | null
    resume_url?: string | null
    experiences?: any[] | null
    educations?: any[] | null
    skills?: any[] | null
  }
  resumeUrl?: string | null
  matchScore?: number | null
  matchScoreDetails?: MatchScoreRow | null
}

export interface CandidateApplicationDetails {
  application: Application
  matchScoreDetails: MatchScoreRow | null
  personalityAnalysis: PersonalityAnalysisRow | null
  resumeUrl: string | null
}

// Validate user is employer and has access to company
async function validateEmployerAccess(userId: string, companyId?: string) {
  // Try to read application-owned profile first
  let { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, role, email')
    .eq('id', userId)
    .single()

  // If the app profile row is missing, attempt to recover from Auth and backfill
  if (error || !user) {
    try {
      const { data: authUserData, error: getAuthErr } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (!getAuthErr && authUserData?.user) {
        const authUser = authUserData.user as any
        const metaRole = authUser?.user_metadata?.role
        const normalizedRole = metaRole === 'job-seeker' || metaRole === 'employee' ? 'job_seeker' : metaRole

        // If Auth says employer, auto-provision minimal users row to keep single-table invariant
        if (normalizedRole === 'employer') {
          const email = authUser?.email as string | null
          await supabaseAdmin
            .from('users')
            .insert({ id: userId, email: email || `${userId}@placeholder.local`, role: 'employer', full_name: authUser?.user_metadata?.full_name || email || null })
            .select('id, role, email')
            .single()
            .then(({ data }) => { user = data as any })
        }
      }
    } catch {
      // ignore and let validation fail below
    }
  }

  if (!user) {
    throw new Error('User not found')
  }

  if (user.role !== 'employer') {
    throw new Error('Access denied. Employer role required')
  }

  if (companyId) {
    // Validate user has access to the company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('owner_id', userId)
      .single()

    if (companyError || !company) {
      throw new Error('Access denied. Invalid company association')
    }
  }

  return user
}

export async function createJob(data: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'posted_at'>, employerId: string) {
  try {
    // Validate employer access to company
    await validateEmployerAccess(employerId, data.company_id)

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert([{
        ...data,
        posted_at: data.status === 'published' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        companies!jobs_company_id_fkey (
          id,
          name,
          logo_url
        )
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`)
    }

    revalidatePath('/employer/jobs')
    return { success: true, data: job }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create job' 
    }
  }
}

export async function updateJob(jobId: string, updates: Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>, employerId: string) {
  try {
    // First get the job to validate ownership
    const { data: existingJob, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        company_id,
        companies!jobs_company_id_fkey (
          owner_id
        )
      `)
      .eq('id', jobId)
      .single()

    if (fetchError || !existingJob) {
      throw new Error('Job not found')
    }

    // Validate employer access
    await validateEmployerAccess(employerId, existingJob.company_id)

    if (existingJob.companies.owner_id !== employerId) {
      throw new Error('Access denied. You can only update jobs for your company')
    }

    // Set posted_at when status changes to published
    const updatedData = { ...updates }
    if (updates.status === 'published' && !updatedData.posted_at) {
      updatedData.posted_at = new Date().toISOString()
    }

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update({
        ...updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select(`
        *,
        companies!jobs_company_id_fkey (
          id,
          name,
          logo_url
        )
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`)
    }

    revalidatePath('/employer/jobs')
    revalidatePath(`/employer/jobs/${jobId}`)
    return { success: true, data: job }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update job' 
    }
  }
}

export async function deleteJob(jobId: string, employerId: string) {
  try {
    // First get the job to validate ownership
    const { data: existingJob, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        company_id,
        companies!jobs_company_id_fkey (
          owner_id
        )
      `)
      .eq('id', jobId)
      .single()

    if (fetchError || !existingJob) {
      throw new Error('Job not found')
    }

    // Validate employer access
    await validateEmployerAccess(employerId, existingJob.company_id)

    if (existingJob.companies.owner_id !== employerId) {
      throw new Error('Access denied. You can only delete jobs for your company')
    }

    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`)
    }

    revalidatePath('/employer/jobs')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete job' 
    }
  }
}

export async function getJobs(employerId: string, filters?: {
  status?: JobStatus
  job_type?: JobType
  search?: string
}) {
  try {
    // Validate employer access
    await validateEmployerAccess(employerId)

    // Get companies owned by the employer
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('owner_id', employerId)

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`)
    }

    if (!companies || companies.length === 0) {
      return { success: true, data: [] }
    }

    const companyIds = companies.map(company => company.id)

    let query = supabaseAdmin
      .from('jobs')
      .select(`
        *,
        companies!jobs_company_id_fkey (
          id,
          name,
          logo_url
        )
      `)
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.job_type) {
      query = query.eq('job_type', filters.job_type)
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    const { data: jobs, error } = await query

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`)
    }

    return { success: true, data: jobs || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch jobs' 
    }
  }
}

export async function getJobById(jobId: string, employerId: string) {
  try {
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        companies!jobs_company_id_fkey (
          id,
          name,
          logo_url,
          owner_id
        )
      `)
      .eq('id', jobId)
      .single()

    if (error || !job) {
      throw new Error('Job not found')
    }

    // Validate employer access
    await validateEmployerAccess(employerId, job.company_id)

    if (job.companies.owner_id !== employerId) {
      throw new Error('Access denied. You can only view jobs for your company')
    }

    return { success: true, data: job }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch job' 
    }
  }
}

export async function updateJobStatus(jobId: string, status: JobStatus, employerId: string) {
  try {
    const result = await updateJob(jobId, { status }, employerId)
    
    revalidatePath('/employer/jobs')
    revalidatePath(`/employer/jobs/${jobId}`)
    
    return result
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update job status' 
    }
  }
}

// Candidate tracking functions
export async function getJobApplications(jobId: string, employerId: string) {
  try {
    // First validate job ownership
    const jobResult = await getJobById(jobId, employerId)
    if (!jobResult.success) {
      return jobResult
    }

    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        job_id,
        applicant_id,
        status,
        cover_letter,
        resume_url,
        notes,
        applied_at,
        updated_at,
        match_score_id,
        applicant:users!applications_applicant_id_fkey (
          id,
          full_name,
          email,
          phone,
          location,
          bio,
          current_job_title,
          linkedin_url,
          github_url,
          portfolio_url,
          resume_url,
          experiences,
          educations,
          skills
        )
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    const { data: matchScores } = await supabaseAdmin
      .from('match_scores')
      .select('*')
      .eq('job_id', jobId)

    const matchScoreMap = buildMatchScoreMap(matchScores || [])
    const enrichedApplications = (applications || []).map((application) => {
      const matchScore = matchScoreMap.get(application.applicant_id) || null
      return formatApplicationRow(application, matchScore)
    })

    return { success: true, data: enrichedApplications }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch applications' 
    }
  }
}

export async function updateApplicationStatus(
  applicationId: string, 
  status: Application['status'], 
  employerId: string,
  notes?: string
) {
  try {
    // First get the application to validate job ownership
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        job_id,
        jobs!applications_job_id_fkey (
          company_id,
          companies!jobs_company_id_fkey (
            owner_id
          )
        )
      `)
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      throw new Error('Application not found')
    }

    // Validate employer access to the company that owns the job
    await validateEmployerAccess(employerId, application.jobs.company_id)

    if (application.jobs.companies.owner_id !== employerId) {
      throw new Error('Access denied. You can only manage applications for your company jobs')
    }

    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data: updatedApplication, error } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select(`
        *,
        applicant:users!applications_applicant_id_fkey (
          id,
          full_name,
          email,
          phone,
          location,
          bio
        )
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update application status: ${error.message}`)
    }

    revalidatePath(`/employer/jobs/${application.job_id}/candidates`)
    return { success: true, data: updatedApplication }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update application status' 
    }
  }
}

export async function getApplicationDetails(applicationId: string, employerId: string) {
  try {
    const { data: applicationRow, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        job_id,
        applicant_id,
        status,
        cover_letter,
        resume_url,
        notes,
        applied_at,
        updated_at,
        match_score_id,
        jobs:applications_job_id_fkey (
          id,
          company_id,
          companies!jobs_company_id_fkey (
            owner_id,
            name
          )
        ),
        applicant:users!applications_applicant_id_fkey (
          id,
          full_name,
          email,
          phone,
          location,
          bio,
          current_job_title,
          linkedin_url,
          github_url,
          portfolio_url,
          resume_url,
          experiences,
          educations,
          skills
        )
      `)
      .eq('id', applicationId)
      .single()

    if (error || !applicationRow) {
      throw new Error('Application not found')
    }

    const ownerId = applicationRow.jobs?.companies?.owner_id
    if (!ownerId || ownerId !== employerId) {
      throw new Error('Access denied. You can only view applications for your company')
    }

    let matchScore: MatchScoreRow | null = null
    if (applicationRow.match_score_id) {
      const { data } = await supabaseAdmin
        .from('match_scores')
        .select('*')
        .eq('id', applicationRow.match_score_id)
        .maybeSingle()
      if (data) {
        matchScore = data
      }
    }

    if (!matchScore) {
      const { data } = await supabaseAdmin
        .from('match_scores')
        .select('*')
        .eq('job_id', applicationRow.job_id)
        .eq('candidate_id', applicationRow.applicant_id)
        .maybeSingle()
      if (data) {
        matchScore = data
      }
    }

    const { data: personalityAnalysis } = await supabaseAdmin
      .from('personality_analysis')
      .select('*')
      .eq('user_id', applicationRow.applicant_id)
      .maybeSingle()

    const application = formatApplicationRow(applicationRow, matchScore)
    const resumeUrl = application.resumeUrl || application.resume_url || null

    return {
      success: true,
      data: {
        application,
        matchScoreDetails: matchScore,
        personalityAnalysis: personalityAnalysis || null,
        resumeUrl,
      } as CandidateApplicationDetails,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch application',
    }
  }
}

export async function getApplicationStats(jobId: string, employerId: string) {
  try {
    // First validate job ownership
    const jobResult = await getJobById(jobId, employerId)
    if (!jobResult.success) {
      return jobResult
    }

    const { data: stats, error } = await supabaseAdmin
      .from('applications')
      .select('status')
      .eq('job_id', jobId)

    if (error) {
      throw new Error(`Failed to fetch application stats: ${error.message}`)
    }

    const statusCounts = {
      pending: 0,
      reviewing: 0,
      interview: 0,
      interviewed: 0,
      offered: 0,
      hired: 0,
      accepted: 0,
      rejected: 0,
    }

    stats?.forEach((app) => {
      const statusKey = app.status as keyof typeof statusCounts
      if (statusCounts[statusKey] !== undefined) {
        statusCounts[statusKey] += 1
      }
    })

    const applicationStats = {
      total: stats?.length || 0,
      pending: statusCounts.pending,
      reviewing: statusCounts.reviewing,
      interviewed: statusCounts.interviewed + statusCounts.interview,
      offered: statusCounts.offered,
      hired: statusCounts.hired,
      accepted: statusCounts.accepted,
      rejected: statusCounts.rejected,
    }

    return { success: true, data: applicationStats }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch application stats' 
    }
  }
}

function buildMatchScoreMap(scores: MatchScoreRow[]): Map<string, MatchScoreRow> {
  const map = new Map<string, MatchScoreRow>()
  scores.forEach((score) => {
    const existing = map.get(score.candidate_id)
    if (!existing) {
      map.set(score.candidate_id, score)
      return
    }
    const existingUpdated = existing.updated_at ? new Date(existing.updated_at).getTime() : 0
    const incomingUpdated = score.updated_at ? new Date(score.updated_at).getTime() : 0
    if (incomingUpdated >= existingUpdated) {
      map.set(score.candidate_id, score)
    }
  })
  return map
}

function formatApplicationRow(row: any, matchScore?: MatchScoreRow | null): Application {
  const applicant = row.applicant || {}
  const normalizeArray = (value: any) => (Array.isArray(value) ? value : null)

  const normalizedApplicant = {
    id: applicant.id || row.applicant_id,
    full_name: applicant.full_name || 'Кандидат',
    email: applicant.email || '',
    phone: applicant.phone || null,
    location: applicant.location || null,
    bio: applicant.bio || null,
    current_job_title: applicant.current_job_title || null,
    linkedin_url: applicant.linkedin_url || null,
    github_url: applicant.github_url || null,
    portfolio_url: applicant.portfolio_url || null,
    resume_url: applicant.resume_url || null,
    experiences: normalizeArray(applicant.experiences),
    educations: normalizeArray(applicant.educations),
    skills: normalizeArray(applicant.skills),
  }

  const resumeUrl = row.resume_url || normalizedApplicant.resume_url || null

  return {
    id: row.id,
    job_id: row.job_id,
    applicant_id: row.applicant_id,
    status: row.status,
    cover_letter: row.cover_letter,
    resume_url: row.resume_url,
    notes: row.notes,
    applied_at: row.applied_at,
    updated_at: row.updated_at,
    applicant: normalizedApplicant,
    resumeUrl,
    matchScore: matchScore?.overall_score ?? null,
    matchScoreDetails: matchScore || null,
  }
}

// Public job search functions
export async function getPublishedJobs(filters?: {
  job_type?: JobType
  experience_level?: ExperienceLevel
  location?: string
  remote_allowed?: boolean
  salary_min?: number
  search?: string
  limit?: number
  offset?: number
}) {
  try {
    let query = supabaseAdmin
      .from('jobs')
      .select(`
        *,
        companies!jobs_company_id_fkey (
          id,
          name,
          logo_url,
          industry,
          size,
          location
        )
      `)
      .eq('status', 'published')
      .order('posted_at', { ascending: false })

    // Apply filters
    if (filters?.job_type) {
      query = query.eq('job_type', filters.job_type)
    }

    if (filters?.experience_level) {
      query = query.eq('experience_level', filters.experience_level)
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    if (filters?.remote_allowed !== undefined) {
      query = query.eq('remote_allowed', filters.remote_allowed)
    }

    if (filters?.salary_min) {
      query = query.gte('salary_min', filters.salary_min)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data: jobs, error } = await query

    if (error) {
      throw new Error(`Failed to fetch published jobs: ${error.message}`)
    }

    return { success: true, data: jobs || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch published jobs' 
    }
  }
}

export async function getPublishedJobById(jobId: string) {
  try {
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        companies!jobs_company_id_fkey (
          id,
          name,
          logo_url,
          industry,
          size,
          location,
          description,
          website
        )
      `)
      .eq('id', jobId)
      .eq('status', 'published')
      .single()

    if (error || !job) {
      throw new Error('Published job not found')
    }

    return { success: true, data: job }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch published job' 
    }
  }
}
