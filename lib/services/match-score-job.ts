'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { calculateMatchScoreForJobUserWithClient } from '@/lib/services/match-service'

type AdminClient = SupabaseClient<Database>

/**
 * Runs the heavy match score calculation using a service-role Supabase client.
 * This bypasses RLS so we can reliably read candidate/job data and write to match_scores.
 */
export async function runMatchScoreJob(jobId: string, userId: string) {
  await calculateMatchScoreForJobUserWithClient(
    supabaseAdmin as AdminClient,
    jobId,
    userId
  )
}

/**
 * Fire-and-forget background job wrapper for server contexts.
 * Errors are logged but do not block the calling request.
 */
export function enqueueMatchScoreJob(jobId: string, userId: string) {
  // Extra safety: this module is server-only, but guard just in case
  if (typeof window !== 'undefined') return

  setTimeout(() => {
    runMatchScoreJob(jobId, userId).catch(error => {
      console.error('Failed to calculate match score in background job (service role):', error)
    })
  }, 0)
}

