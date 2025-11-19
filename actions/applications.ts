"use server"

import { z } from "zod"
import { supabase } from "@/lib/supabase-client"
import { enqueueMatchScoreJob } from "@/lib/services/match-score-job"
import { getCurrentUser } from "./auth"

// Types
interface Application {
  id: string
  job_id: string
  applicant_id: string
  status:
    | "pending"
    | "reviewing"
    | "interview"
    | "interviewed"
    | "offered"
    | "accepted"
    | "rejected"
    | "hired"
  cover_letter: string | null
  resume_url: string | null
  notes: string | null
  applied_at: string
  updated_at: string
  // Relations
  job?: {
    id: string
    title: string
    company_id: string
    companies?: {
      name: string
      logo_url: string | null
    }
  }
  applicant?: {
    id: string
    full_name: string
    email: string
    phone: string | null
    location: string | null
  }
}

// Schemas
const createApplicationSchema = z.object({
  job_id: z.string().uuid("Invalid job ID"),
  cover_letter: z.string().optional(),
  resume_url: z.string().url().optional(),
})

const updateApplicationStatusSchema = z.object({
  status: z.enum(["reviewing", "interview", "interviewed", "offered", "accepted", "rejected", "hired"]),
  notes: z.string().optional(),
})

// Application functions
export async function createApplication(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "job_seeker") {
    return {
      success: false,
      message: "Unauthorized. Only job seekers can apply for jobs.",
    }
  }

  const data = Object.fromEntries(formData)
  const parsed = createApplicationSchema.safeParse(data)

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data. Please check your entries.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    // Check if user already applied for this job
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', parsed.data.job_id)
      .eq('applicant_id', user.id)
      .single()

    if (existingApplication) {
      return {
        success: false,
        message: "You have already applied for this job.",
      }
    }

    // Check if job exists and is published
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', parsed.data.job_id)
      .eq('status', 'published')
      .single()

    if (jobError || !job) {
      return {
        success: false,
        message: "Job not found or is no longer available.",
      }
    }

    // Create application
    const { data: applicationData, error } = await supabase
      .from('applications')
      .insert({
        job_id: parsed.data.job_id,
        applicant_id: user.id,
        cover_letter: parsed.data.cover_letter,
        resume_url: parsed.data.resume_url,
        status: 'pending',
        applied_at: new Date().toISOString(),
      })
      .select(`
        *,
        job:jobs (
          id,
          title,
          company_id,
          companies!jobs_company_id_fkey (
            name,
            logo_url
          )
        )
      `)
      .single()

    if (error) {
      return {
        success: false,
        message: "Failed to submit application. Please try again.",
      }
    }

    // Trigger background AI scoring so employer and seeker see up-to-date data
    enqueueMatchScoreJob(parsed.data.job_id, user.id)

    return {
      success: true,
      message: "Application submitted successfully!",
      data: applicationData,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getApplicationsByApplicant(applicantId?: string): Promise<Application[]> {
  try {
    const user = await getCurrentUser()
    const targetApplicantId = applicantId || user?.id

    if (!targetApplicantId) {
      return []
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs (
          id,
          title,
          company_id,
          companies!jobs_company_id_fkey (
            name,
            logo_url
          )
        ),
        applicant:users!applications_applicant_id_fkey (
          id,
          full_name,
          email,
          phone,
          location
        )
      `)
      .eq('applicant_id', targetApplicantId)
      .order('applied_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data as Application[]
  } catch (error) {
    return []
  }
}

export async function getApplicationsByJob(jobId: string): Promise<Application[]> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "employer") {
      return []
    }

    // Verify job ownership through company
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id,
        companies!jobs_company_id_fkey (
          owner_id
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job || job.companies.owner_id !== user.id) {
      return []
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs (
          id,
          title,
          company_id,
          companies!jobs_company_id_fkey (
            name,
            logo_url
          )
        ),
        applicant:users!applications_applicant_id_fkey (
          id,
          full_name,
          email,
          phone,
          location
        )
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data as Application[]
  } catch (error) {
    return []
  }
}

export async function getApplicationsByEmployer(employerId?: string): Promise<Application[]> {
  try {
    const user = await getCurrentUser()
    const targetEmployerId = employerId || user?.id

    if (!targetEmployerId || user?.role !== "employer") {
      return []
    }

    // Get companies owned by the employer
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', targetEmployerId)

    if (companiesError || !companies || companies.length === 0) {
      return []
    }

    const companyIds = companies.map(company => company.id)

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs!inner (
          id,
          title,
          company_id,
          companies!jobs_company_id_fkey (
            name,
            logo_url
          )
        ),
        applicant:users!applications_applicant_id_fkey (
          id,
          full_name,
          email,
          phone,
          location
        )
      `)
      .in('job.company_id', companyIds)
      .order('applied_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data as Application[]
  } catch (error) {
    return []
  }
}

export async function getApplicationById(id: string): Promise<Application | null> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs (
          id,
          title,
          company_id,
          companies!jobs_company_id_fkey (
            name,
            logo_url,
            owner_id
          )
        ),
        applicant:users!applications_applicant_id_fkey (
          id,
          full_name,
          email,
          phone,
          location
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    // Check permissions
    const application = data as Application
    const canView = 
      user.role === "job_seeker" && application.applicant_id === user.id ||
      user.role === "employer" && application.job?.companies?.owner_id === user.id

    if (!canView) {
      return null
    }

    return application
  } catch (error) {
    return null
  }
}

export async function updateApplicationStatus(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "employer") {
    return {
      success: false,
      message: "Unauthorized. Only employers can update application status.",
    }
  }

  const data = Object.fromEntries(formData)
  const parsed = updateApplicationStatusSchema.safeParse(data)

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data. Please check your entries.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    // Verify application exists and employer owns the job through company
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        id,
        job:jobs (
          id,
          company_id,
          companies!jobs_company_id_fkey (
            owner_id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !application || application.job?.companies?.owner_id !== user.id) {
      return {
        success: false,
        message: "Application not found or you don't have permission to update it.",
      }
    }

    const { data: applicationData, error } = await supabase
      .from('applications')
      .update({
        status: parsed.data.status,
        notes: parsed.data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        job:jobs (
          id,
          title,
          company_id,
          companies!jobs_company_id_fkey (
            name,
            logo_url
          )
        ),
        applicant:users!applications_applicant_id_fkey (
          id,
          full_name,
          email,
          phone,
          location
        )
      `)
      .single()

    if (error) {
      return {
        success: false,
        message: "Failed to update application status. Please try again.",
      }
    }

    return {
      success: true,
      message: "Application status updated successfully!",
      data: applicationData,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function withdrawApplication(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "job_seeker") {
    return {
      success: false,
      message: "Unauthorized. Only job seekers can withdraw applications.",
    }
  }

  try {
    // Verify application ownership
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('applicant_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !application || application.applicant_id !== user.id) {
      return {
        success: false,
        message: "Application not found or you don't have permission to withdraw it.",
      }
    }

    if (application.status === 'accepted') {
      return {
        success: false,
        message: "Cannot withdraw an application that has been accepted.",
      }
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) {
      return {
        success: false,
        message: "Failed to withdraw application. Please try again.",
      }
    }

    return {
      success: true,
      message: "Application withdrawn successfully!",
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function checkApplicationExists(jobId: string, applicantId?: string): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const targetApplicantId = applicantId || user?.id

    if (!targetApplicantId) {
      return false
    }

    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_id', targetApplicantId)
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}

type ApplicationStats = {
  total: number
  pending: number
  reviewing: number
  interview: number
  interviewed: number
  offered: number
  accepted: number
  hired: number
  rejected: number
}

const EMPTY_APPLICATION_STATS: ApplicationStats = {
  total: 0,
  pending: 0,
  reviewing: 0,
  interview: 0,
  interviewed: 0,
  offered: 0,
  accepted: 0,
  hired: 0,
  rejected: 0,
}

export async function getApplicationStats(employerId?: string): Promise<ApplicationStats> {
  try {
    const user = await getCurrentUser()
    const targetEmployerId = employerId || user?.id

    if (!targetEmployerId || user?.role !== "employer") {
      return { ...EMPTY_APPLICATION_STATS }
    }

    // Get companies owned by the employer
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', targetEmployerId)

    if (companiesError || !companies || companies.length === 0) {
      return { ...EMPTY_APPLICATION_STATS }
    }

    const companyIds = companies.map(company => company.id)

    const { data, error } = await supabase
      .from('applications')
      .select(`
        status,
        job:jobs!inner (company_id)
      `)
      .in('job.company_id', companyIds)

    if (error || !data) {
      return { ...EMPTY_APPLICATION_STATS }
    }

    const stats = data.reduce((acc, app) => {
      acc.total++

      if (app.status in acc) {
        acc[app.status as keyof ApplicationStats]++
      }

      return acc
    }, { ...EMPTY_APPLICATION_STATS })

    return stats
  } catch (error) {
    return { ...EMPTY_APPLICATION_STATS }
  }
}
