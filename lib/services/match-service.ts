import { supabase } from '../supabase-client';
import { calculateMatchScore, JobData, CandidateData } from '../ai/match-scorer';
import { Job } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

type DbClient = SupabaseClient<Database>;

export interface JobWithMatchScore extends Job {
  matchScore?: number;
  matchExplanation?: string;
  matchConfidence?: number;
}

/**
 * Get or calculate match score for a specific job and user
 */
export async function getJobMatchScore(
  jobId: string, 
  userId: string
): Promise<{ score: number; explanation?: string; confidence?: number } | null> {
  try {
    // First check if we already have a cached match score
    const { data: existingScore } = await supabase
      .from('match_scores')
      .select('overall_score, match_explanation, ai_confidence_score')
      .eq('job_id', jobId)
      .eq('candidate_id', userId)
      .single();

    if (existingScore) {
      return {
        score: existingScore.overall_score,
        explanation: existingScore.match_explanation || undefined,
        confidence: existingScore.ai_confidence_score || undefined
      };
    }

    // If no cached score, try to calculate one
    const matchData = await calculateMatchScoreForJobUser(jobId, userId);
    if (matchData) {
      return {
        score: matchData.overall_score,
        explanation: matchData.match_explanation || undefined,
        confidence: matchData.ai_confidence_score || undefined
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting job match score:', error);
    return null;
  }
}

/**
 * Get match scores for multiple jobs for a user
 */
export async function getBatchJobMatchScores(
  jobIds: string[],
  userId: string
): Promise<Record<string, { score: number; explanation?: string; confidence?: number }>> {
  const scoreMap: Record<string, { score: number; explanation?: string; confidence?: number }> = {};
  try {
    // Get existing cached scores only (AI runs server-side via background jobs)
    const { data: existingScores } = await supabase
      .from('match_scores')
      .select('job_id, overall_score, match_explanation, ai_confidence_score')
      .eq('candidate_id', userId)
      .in('job_id', jobIds);

    existingScores?.forEach(score => {
      scoreMap[score.job_id] = {
        score: score.overall_score,
        explanation: score.match_explanation || undefined,
        confidence: score.ai_confidence_score || undefined
      };
    });

    const missingJobIds = jobIds.filter(id => !scoreMap[id]);

    if (missingJobIds.length > 0) {
      if (typeof window === 'undefined') {
        // On the server we can enqueue directly (e.g., server components)
        missingJobIds.forEach(jobId => enqueueMatchScoreJob(jobId, userId));
      } else {
        // In the browser, call an API route that runs the server-side job
        missingJobIds.forEach(jobId => {
          fetch('/api/match-scores/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId })
          }).catch(error => {
            console.error('Failed to enqueue match score via API for job', jobId, error);
          });
        });
      }
    }

    return scoreMap;
  } catch (error) {
    console.error('Error getting batch job match scores:', error);
    return scoreMap;
  }
}

/**
 * Core implementation that calculates a match score using AI and caches it
 * using the provided Supabase client. This allows server callers to inject
 * a service-role client to bypass RLS where appropriate.
 */
export async function calculateMatchScoreForJobUserWithClient(
  client: DbClient,
  jobId: string,
  userId: string
): Promise<{ overall_score: number; match_explanation?: string; ai_confidence_score?: number } | null> {
  try {
    // Get job data
    const { data: job } = await client
      .from('jobs')
      .select(`
        *,
        companies (name, description, company_culture),
        job_skills (
          required,
          skills (name, category)
        )
      `)
      .eq('id', jobId)
      .single();

    if (!job) return null;

    // Get candidate data (single-table approach)
    const { data: user } = await client
      .from('users')
      .select(`
        *,
        user_skills (
          proficiency_level,
          skills (name, category)
        ),
        personality_analysis (*)
      `)
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'job_seeker') return null;

    // Transform data for AI analysis
    const jobData: JobData = {
      title: job.title,
      description: job.description,
      requirements: job.requirements || '',
      responsibilities: job.responsibilities || '',
      experience_level: job.experience_level,
      job_type: job.job_type,
      location: job.location || '',
      remote_allowed: job.remote_allowed,
      company_culture: job.companies?.company_culture || job.companies?.description || '',
      required_skills: job.job_skills?.filter(js => js.required).map(js => js.skills.name) || [],
      preferred_skills: job.job_skills?.filter(js => !js.required).map(js => js.skills.name) || []
    };

    // Normalize candidate skills from relation and JSON fallback
    const relationSkills = (user as any).user_skills?.map((us: any) => ({
      name: us.skills.name as string,
      proficiency_level: (us.proficiency_level as number) || 3,
    })) || []
    const jsonSkills = Array.isArray((user as any).skills)
      ? ((user as any).skills as any[]).map((s: any) => ({
          name: typeof s === 'string' ? s : (s?.name || ''),
          proficiency_level: (s?.proficiency_level as number) || 3,
        }))
      : []
    const mergedSkills = [...relationSkills]
    const seen = new Set(relationSkills.map(s => s.name.toLowerCase()))
    for (const s of jsonSkills) {
      const key = s.name?.toLowerCase()
      if (key && !seen.has(key)) mergedSkills.push(s)
    }

    const candidateData: CandidateData = {
      full_name: user.full_name,
      experience_years: undefined, // Could be calculated from experiences JSON
      current_job_title: user.current_job_title || undefined,
      skills: mergedSkills,
      experience: (user.experiences as any[]) || [], // From JSON field
      education: (user.educations as any[]) || [], // From JSON field
      personality_analysis: (user as any).personality_analysis ? {
        problem_solving_style: (user as any).personality_analysis.problem_solving_style || '',
        work_preference: (user as any).personality_analysis.work_preference || '',
        analytical_score: (user as any).personality_analysis.analytical_score || 75,
        creative_score: (user as any).personality_analysis.creative_score || 75,
        leadership_score: (user as any).personality_analysis.leadership_score || 75,
        teamwork_score: (user as any).personality_analysis.teamwork_score || 75,
        strengths: []
      } : undefined,
      preferred_location: user.location || undefined, // From users table
      remote_preference: undefined // Could be added to users table if needed
    };

    // Calculate match score using AI
    const aiResult = await calculateMatchScore(jobData, candidateData);
    
    if (!aiResult.success || !aiResult.data) {
      return null;
    }

    const matchResult = aiResult.data;

    // Cache the result in the database (upsert to handle duplicates)
    const { data: savedScore, error: upsertError } = await client
      .from('match_scores')
      .upsert({
        job_id: jobId,
        candidate_id: userId,
        overall_score: matchResult.overall_score,
        skills_match_score: matchResult.skills_match_score,
        experience_match_score: matchResult.experience_match_score,
        culture_fit_score: matchResult.culture_fit_score,
        personality_match_score: matchResult.personality_match_score,
        match_explanation: matchResult.match_explanation,
        strengths: matchResult.strengths,
        potential_concerns: matchResult.potential_concerns,
        ai_confidence_score: matchResult.confidence_score
      }, {
        onConflict: 'job_id,candidate_id'
      })
      .select()
      .single();

    if (upsertError) {
      throw new Error(`Failed to save match score: ${upsertError.message}`);
    }

    return {
      overall_score: matchResult.overall_score,
      match_explanation: matchResult.match_explanation,
      ai_confidence_score: matchResult.confidence_score
    };

  } catch (error) {
    console.error('Error calculating match score:', error);
    return null;
  }
}

/**
 * Calculate match score using AI and cache it with the default shared client.
 * This is safe for browser usage where the client has an authenticated session.
 * Server callers that need to bypass RLS should use calculateMatchScoreForJobUserWithClient.
 */
export async function calculateMatchScoreForJobUser(
  jobId: string,
  userId: string
): Promise<{ overall_score: number; match_explanation?: string; ai_confidence_score?: number } | null> {
  return calculateMatchScoreForJobUserWithClient(supabase, jobId, userId);
}

/**
 * Lightweight job runner that defers AI match score calculation so it does not block user actions
 */
export function enqueueMatchScoreJob(jobId: string, userId: string) {
  // Ensure this only runs on the server
  if (typeof window !== 'undefined') return

  // Fire-and-forget the heavy AI computation
  setTimeout(() => {
    calculateMatchScoreForJobUser(jobId, userId).catch(error => {
      console.error('Failed to calculate match score in background job:', error)
    })
  }, 0)
}

/**
 * Enhanced jobs search with match scores
 */
export async function searchJobsWithMatchScores(
  userId: string | null,
  filters: any = {}
): Promise<JobWithMatchScore[]> {
  // Get jobs using the existing search function
  const { searchJobs } = await import('../jobs');
  const jobs = await searchJobs(filters);

  if (!userId) {
    // Return jobs without match scores if user not logged in
    return jobs.map(job => ({ ...job, matchScore: undefined }));
  }

  // Get match scores for all jobs
  const jobIds = jobs.map(job => job.id);
  const matchScores = await getBatchJobMatchScores(jobIds, userId);

  // Combine jobs with match scores
  const jobsWithScores: JobWithMatchScore[] = jobs.map(job => ({
    ...job,
    matchScore: matchScores[job.id]?.score,
    matchExplanation: matchScores[job.id]?.explanation,
    matchConfidence: matchScores[job.id]?.confidence
  }));

  // Sort by match score (highest first) if user is logged in
  return jobsWithScores.sort((a, b) => {
    if (a.matchScore && b.matchScore) {
      return b.matchScore - a.matchScore;
    }
    if (a.matchScore && !b.matchScore) return -1;
    if (!a.matchScore && b.matchScore) return 1;
    return 0;
  });
}
