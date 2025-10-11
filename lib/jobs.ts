import { supabase } from './supabase-client'
import { Job, JobFilters, JobApplication, JobApplicationWithJob } from './types'

export async function searchJobs(filters: JobFilters = {}): Promise<Job[]> {
  let query = supabase
    .from('jobs')
    .select(`
      *,
      companies!inner (
        id,
        name,
        logo_url,
        industry,
        size,
        location,
        description,
        website
      ),
      job_skills (
        id,
        skill_id,
        required,
        skills (
          id,
          name,
          category
        )
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  if (filters.job_type) {
    query = query.eq('job_type', filters.job_type)
  }

  if (filters.experience_level) {
    query = query.eq('experience_level', filters.experience_level)
  }

  if (filters.remote_allowed !== undefined) {
    query = query.eq('remote_allowed', filters.remote_allowed)
  }

  if (filters.salary_min) {
    query = query.gte('salary_min', filters.salary_min)
  }

  if (filters.salary_max) {
    query = query.lte('salary_max', filters.salary_max)
  }

  if (filters.keywords) {
    const kw = filters.keywords.replace(/%/g, '')
    query = query.or(`title.ilike.%${kw}%,description.ilike.%${kw}%`)
  }

  // Limit results to avoid heavy payloads
  const { data, error } = await query.limit(24)

  if (error) {
    console.error('Error fetching jobs:', error)
    throw error
  }

  return data || []
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies (
        id,
        name,
        logo_url,
        industry,
        size,
        location,
        description,
        website
      ),
      job_skills (
        id,
        skill_id,
        required,
        skills (
          id,
          name,
          category
        )
      )
    `)
    .eq('id', jobId)
    .single()

  if (error) {
    console.error('Error fetching job:', error)
    return null
  }

  return data
}

export async function applyToJob(
  userId: string,
  jobId: string,
  coverLetter?: string,
  resumeUrl?: string
): Promise<JobApplication> {
  // Check if user already applied
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .single()

  if (existingApplication) {
    throw new Error('You have already applied to this job')
  }

  const applicationData = {
    user_id: userId,
    job_id: jobId,
    status: 'pending' as const,
    cover_letter: coverLetter,
    resume_url: resumeUrl,
    applied_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('applications')
    .insert([applicationData])
    .select()
    .single()

  if (error) {
    console.error('Error applying to job:', error)
    throw error
  }

  return data
}

export async function getUserApplications(userId: string): Promise<JobApplicationWithJob[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs(*)
    `)
    .eq('user_id', userId)
    .order('applied_at', { ascending: false })

  if (error) {
    console.error('Error fetching user applications:', error)
    throw error
  }

  return data || []
}