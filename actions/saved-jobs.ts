"use server"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// Types
interface SavedJob {
  id: string
  job_id: string
  candidate_id: string
  created_at?: string
  job?: {
    id: string
    title: string
    location: string | null
    job_type: string
    salary_min?: number | null
    salary_max?: number | null
    currency?: string | null
    remote_allowed?: boolean | null
    employer_id: string
    company?: {
      id: string
      name: string | null
      logo_url?: string | null
    }
  }
}

// Saved jobs functions
export async function saveJob(jobId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      success: false,
      message: "Authentication required.",
    }
  }

  // Get user role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData || userData.role !== "job_seeker") {
    return {
      success: false,
      message: "Unauthorized. Only job seekers can save jobs.",
    }
  }

  try {
    // Check if job is already saved
    const { data: existingSave } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', user.id)
      .single()

    if (existingSave) {
      return {
        success: false,
        message: "Job is already saved.",
      }
    }

    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('status', 'published')
      .single()

    if (jobError || !job) {
      return {
        success: false,
        message: "Job not found or is no longer available.",
      }
    }

    // Save the job
    const { data: savedJobData, error } = await supabase
      .from('saved_jobs')
      .insert({
        job_id: jobId,
        candidate_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        message: "Failed to save job. Please try again.",
      }
    }

    return {
      success: true,
      message: "Job saved successfully!",
      data: savedJobData,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function unsaveJob(jobId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      success: false,
      message: "Authentication required.",
    }
  }

  // Get user role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData || userData.role !== "job_seeker") {
    return {
      success: false,
      message: "Unauthorized. Only job seekers can unsave jobs.",
    }
  }

  try {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('candidate_id', user.id)

    if (error) {
      return {
        success: false,
        message: "Failed to remove saved job. Please try again.",
      }
    }

    return {
      success: true,
      message: "Job removed from saved list!",
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getSavedJobs(candidateId?: string): Promise<SavedJob[]> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return []
    }

    const targetCandidateId = candidateId || user.id

    if (!targetCandidateId) {
      return []
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`
        *,
        job:jobs (
          id,
          title,
          location,
          job_type,
          salary_min,
          salary_max,
          currency,
          remote_allowed,
          company:companies!jobs_company_id_fkey (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq('candidate_id', targetCandidateId)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data as SavedJob[]
  } catch (error) {
    return []
  }
}

export async function isJobSaved(jobId: string, candidateId?: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return false
    }

    const targetCandidateId = candidateId || user.id

    if (!targetCandidateId) {
      return false
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', targetCandidateId)
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}