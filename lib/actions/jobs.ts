'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
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

export interface Application {
  id: string
  job_id: string
  applicant_id: string
  status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected'
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
  }
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
        applicant:users!applications_applicant_id_fkey (
          id,
          full_name,
          email,
          phone,
          location,
          bio
        )
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    return { success: true, data: applications || [] }
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

    const applicationStats = {
      total: stats?.length || 0,
      pending: stats?.filter(app => app.status === 'pending').length || 0,
      reviewing: stats?.filter(app => app.status === 'reviewing').length || 0,
      interview: stats?.filter(app => app.status === 'interview').length || 0,
      accepted: stats?.filter(app => app.status === 'accepted').length || 0,
      rejected: stats?.filter(app => app.status === 'rejected').length || 0,
    }

    return { success: true, data: applicationStats }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch application stats' 
    }
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