import { supabase } from '../supabase-client';
import { calculateMatchScore, JobData, CandidateData } from '../ai/match-scorer';
import { Job } from '../types';

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
  try {
    // Get existing cached scores
    const { data: existingScores } = await supabase
      .from('match_scores')
      .select('job_id, overall_score, match_explanation, ai_confidence_score')
      .eq('candidate_id', userId)
      .in('job_id', jobIds);

    const scoreMap: Record<string, { score: number; explanation?: string; confidence?: number }> = {};

    // Map existing scores
    existingScores?.forEach(score => {
      scoreMap[score.job_id] = {
        score: score.overall_score,
        explanation: score.match_explanation || undefined,
        confidence: score.ai_confidence_score || undefined
      };
    });

    // For missing scores, we could calculate them, but for performance reasons,
    // let's return a default score for now
    const missingJobIds = jobIds.filter(id => !scoreMap[id]);
    for (const jobId of missingJobIds) {
      // Return a default score of 75 for jobs without calculated scores
      // In production, you might want to calculate these asynchronously
      scoreMap[jobId] = {
        score: 75,
        explanation: 'Match score pending AI analysis',
        confidence: 0.5
      };
    }

    return scoreMap;
  } catch (error) {
    console.error('Error getting batch job match scores:', error);
    // Return default scores for all jobs
    const defaultScores: Record<string, { score: number; explanation?: string; confidence?: number }> = {};
    jobIds.forEach(jobId => {
      defaultScores[jobId] = {
        score: 75,
        explanation: 'Unable to calculate match score',
        confidence: 0.3
      };
    });
    return defaultScores;
  }
}

/**
 * Calculate match score using AI and cache it
 */
async function calculateMatchScoreForJobUser(
  jobId: string,
  userId: string
): Promise<{ overall_score: number; match_explanation?: string; ai_confidence_score?: number } | null> {
  try {
    // Get job data
    const { data: job } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (name, description),
        job_skills (
          required,
          skills (name, category)
        )
      `)
      .eq('id', jobId)
      .single();

    if (!job) return null;

    // Get candidate data (single-table approach)
    const { data: user } = await supabase
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
      company_culture: job.companies?.description || '',
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
    const { data: savedScore, error: upsertError } = await supabase
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