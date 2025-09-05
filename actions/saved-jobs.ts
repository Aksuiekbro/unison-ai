"use server"

import { supabase } from "@/lib/supabase-client"
import { getCurrentUser } from "./auth"

// Types
interface SavedJob {
  id: string
  job_id: string
  candidate_id: string
  created_at?: string
  // Relations
  job?: {
    title: string
    location: string
    employment_type: string
    salary_from?: number
    salary_to?: number
    currency?: string
    employer_id: string
  }
}

// Saved jobs functions
export async function saveJob(jobId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "employee") {
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
  const user = await getCurrentUser()
  if (!user || user.role !== "employee") {
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
    const user = await getCurrentUser()
    const targetCandidateId = candidateId || user?.id

    if (!targetCandidateId) {
      return []
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`
        *,
        job:jobs (
          title,
          location,
          employment_type,
          salary_from,
          salary_to,
          currency,
          employer_id
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
    const user = await getCurrentUser()
    const targetCandidateId = candidateId || user?.id

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