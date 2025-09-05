"use server"

import { z } from "zod"
import { supabase } from "@/lib/supabase-client"
import { getCurrentUser } from "./auth"

// Types
interface Job {
  id: string
  title: string
  description: string
  requirements: string | null
  responsibilities: string | null
  company_id: string
  job_type: "full_time" | "part_time" | "contract" | "internship"
  experience_level: "entry" | "junior" | "mid" | "senior" | "executive"
  salary_min: number | null
  salary_max: number | null
  currency: string
  location: string | null
  remote_allowed: boolean
  status: "draft" | "published" | "closed" | "cancelled"
  posted_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

// Schemas
const createJobSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  location: z.string().optional(),
  job_type: z.enum(["full_time", "part_time", "contract", "internship"]),
  experience_level: z.enum(["entry", "junior", "mid", "senior", "executive"]),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  currency: z.string().default("USD"),
  remote_allowed: z.boolean().default(false),
  expires_at: z.string().optional(),
  status: z.enum(["draft", "published"]).default("published"),
})

const updateJobSchema = createJobSchema.partial()

// Validate user is employer and has access to company
async function validateEmployerAccess(userId: string, companyId?: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (error || !user) {
    throw new Error('User not found')
  }

  if (user.role !== 'employer') {
    throw new Error('Access denied. Employer role required')
  }

  if (companyId) {
    // Validate user has access to the company
    const { data: company, error: companyError } = await supabase
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

// Job CRUD functions
export async function createJob(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "employer") {
    return {
      success: false,
      message: "Unauthorized. Only employers can create jobs.",
    }
  }

  // First get user's company
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)

  if (companyError || !companies || companies.length === 0) {
    return {
      success: false,
      message: "You must create a company profile before posting jobs.",
    }
  }

  const companyId = companies[0].id

  const data = Object.fromEntries(formData)

  const parsed = createJobSchema.safeParse({
    ...data,
    salary_min: data.salary_min ? Number(data.salary_min) : undefined,
    salary_max: data.salary_max ? Number(data.salary_max) : undefined,
    remote_allowed: data.remote_allowed === "on",
  })

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data. Please check your entries.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const jobData = {
      ...parsed.data,
      company_id: companyId,
      posted_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
    }

    const { data: createdJob, error } = await supabase
      .from('jobs')
      .insert(jobData)
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
      return {
        success: false,
        message: "Failed to create job. Please try again.",
      }
    }

    return {
      success: true,
      message: "Job created successfully!",
      data: createdJob,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getJobsByEmployer(employerId?: string): Promise<Job[]> {
  try {
    const user = await getCurrentUser()
    const targetEmployerId = employerId || user?.id

    if (!targetEmployerId) {
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

    if (error || !data) {
      return []
    }

    return data as Job[]
  } catch (error) {
    return []
  }
}

export async function getJobById(id: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return data as Job
  } catch (error) {
    return null
  }
}

export async function updateJob(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "employer") {
    return {
      success: false,
      message: "Unauthorized. Only employers can update jobs.",
    }
  }

  try {
    // Verify ownership through company
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select(`
        id,
        company_id,
        companies!jobs_company_id_fkey (
          owner_id
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingJob || existingJob.companies.owner_id !== user.id) {
      return {
        success: false,
        message: "Job not found or you don't have permission to update it.",
      }
    }

    const data = Object.fromEntries(formData)

    const parsed = updateJobSchema.safeParse({
      ...data,
      salary_min: data.salary_min ? Number(data.salary_min) : undefined,
      salary_max: data.salary_max ? Number(data.salary_max) : undefined,
      remote_allowed: data.remote_allowed === "on",
    })

    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid form data. Please check your entries.",
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    // Set posted_at when status changes to published
    const updatedData = { ...parsed.data }
    if (parsed.data.status === 'published' && !updatedData.posted_at) {
      updatedData.posted_at = new Date().toISOString()
    }

    const { data: jobData, error } = await supabase
      .from('jobs')
      .update({
        ...updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
      return {
        success: false,
        message: "Failed to update job. Please try again.",
      }
    }

    return {
      success: true,
      message: "Job updated successfully!",
      data: jobData,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteJob(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "employer") {
    return {
      success: false,
      message: "Unauthorized. Only employers can delete jobs.",
    }
  }

  try {
    // Verify ownership through company
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select(`
        id,
        company_id,
        companies!jobs_company_id_fkey (
          owner_id
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingJob || existingJob.companies.owner_id !== user.id) {
      return {
        success: false,
        message: "Job not found or you don't have permission to delete it.",
      }
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) {
      return {
        success: false,
        message: "Failed to delete job. Please try again.",
      }
    }

    return {
      success: true,
      message: "Job deleted successfully!",
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function searchJobs(query?: string, filters?: {
  location?: string
  job_type?: string
  experience_level?: string
  remote_allowed?: boolean
}): Promise<Job[]> {
  try {
    let queryBuilder = supabase
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

    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,requirements.ilike.%${query}%`
      )
    }

    if (filters?.location) {
      queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`)
    }

    if (filters?.job_type) {
      queryBuilder = queryBuilder.eq('job_type', filters.job_type)
    }

    if (filters?.experience_level) {
      queryBuilder = queryBuilder.eq('experience_level', filters.experience_level)
    }

    if (filters?.remote_allowed) {
      queryBuilder = queryBuilder.eq('remote_allowed', true)
    }

    const { data, error } = await queryBuilder.order('posted_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data as Job[]
  } catch (error) {
    return []
  }
}

export async function toggleJobStatus(id: string, status: "published" | "closed" | "cancelled") {
  const user = await getCurrentUser()
  if (!user || user.role !== "employer") {
    return {
      success: false,
      message: "Unauthorized. Only employers can update job status.",
    }
  }

  try {
    // Verify ownership through company
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select(`
        id,
        company_id,
        companies!jobs_company_id_fkey (
          owner_id
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingJob || existingJob.companies.owner_id !== user.id) {
      return {
        success: false,
        message: "Job not found or you don't have permission to update it.",
      }
    }

    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    }

    // Set posted_at when publishing
    if (status === 'published') {
      updateData.posted_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return {
        success: false,
        message: "Failed to update job status. Please try again.",
      }
    }

    return {
      success: true,
      message: `Job ${status} successfully!`,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}