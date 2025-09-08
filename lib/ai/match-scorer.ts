import { generateStructuredResponse, withRateLimit, AIResponse } from './gemini';

export interface MatchScoreResult {
  overall_score: number; // 0-100
  skills_match_score: number; // 0-100
  experience_match_score: number; // 0-100
  culture_fit_score: number; // 0-100
  personality_match_score: number; // 0-100
  
  match_explanation: string;
  strengths: string;
  potential_concerns: string;
  
  confidence_score: number; // 0-1
  recommendations: string[];
}

export interface JobData {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  experience_level: string;
  job_type: string;
  location: string;
  remote_allowed: boolean;
  company_culture?: string;
  required_skills: string[];
  preferred_skills: string[];
}

export interface CandidateData {
  full_name: string;
  experience_years?: number;
  current_job_title?: string;
  skills: Array<{
    name: string;
    proficiency_level: number;
  }>;
  experience: Array<{
    job_title: string;
    company_name: string;
    description: string;
    years: number;
  }>;
  education: Array<{
    degree: string;
    field_of_study: string;
    institution_name: string;
  }>;
  personality_analysis?: {
    problem_solving_style: string;
    work_preference: string;
    analytical_score: number;
    creative_score: number;
    leadership_score: number;
    teamwork_score: number;
    strengths: string[];
  };
  preferred_location?: string;
  remote_preference?: boolean;
}

const matchScoreSchema = {
  overall_score: "number 0-100 - weighted average of all component scores",
  skills_match_score: "number 0-100 - how well candidate skills match job requirements",
  experience_match_score: "number 0-100 - relevance of candidate experience to role",
  culture_fit_score: "number 0-100 - alignment with company culture and values",
  personality_match_score: "number 0-100 - personality fit for role requirements",
  
  match_explanation: "string - 2-3 sentences explaining overall compatibility",
  strengths: "string - key strengths that make this a good match",
  potential_concerns: "string - areas where candidate might not be ideal fit",
  
  confidence_score: "number 0-1 - AI confidence in this analysis",
  recommendations: ["array of strings - specific recommendations for both candidate and employer"]
};

/**
 * Calculate AI-powered match score between candidate and job
 */
export async function calculateMatchScore(
  job: JobData,
  candidate: CandidateData
): Promise<AIResponse<MatchScoreResult>> {
  const systemContext = `
You are an expert HR analyst specializing in candidate-job matching. Your task is to evaluate how well a candidate fits a specific job role across multiple dimensions.

Evaluation Criteria:
1. Skills Match (30% weight): Compare required/preferred skills with candidate skills and proficiency levels
2. Experience Match (25% weight): Relevance of work history, years of experience, and career progression
3. Culture Fit (20% weight): Alignment with company culture, work style preferences, and team dynamics
4. Personality Match (25% weight): Soft skills alignment with role requirements and team needs

Scoring Guidelines:
- 90-100: Exceptional fit, ideal candidate
- 80-89: Strong fit, highly recommended
- 70-79: Good fit, recommended with minor concerns
- 60-69: Moderate fit, considerable evaluation needed
- 50-59: Weak fit, significant concerns
- 0-49: Poor fit, not recommended

Be objective and evidence-based. Consider both strengths and weaknesses. Factor in the seniority level of the role when evaluating experience requirements.

For Kazakhstan job market context:
- Consider local industry standards and career progression patterns
- Account for cultural fit in team-oriented work environments
- Balance technical skills with soft skills appropriately for SMB context
`;

  const jobSummary = `
JOB DETAILS:
Title: ${job.title}
Experience Level: ${job.experience_level}
Job Type: ${job.job_type}
Location: ${job.location}${job.remote_allowed ? ' (Remote allowed)' : ''}

Description: ${job.description}
Requirements: ${job.requirements}
Responsibilities: ${job.responsibilities}

Required Skills: ${job.required_skills.join(', ')}
Preferred Skills: ${job.preferred_skills.join(', ')}
Company Culture: ${job.company_culture || 'Not specified'}
`;

  const candidateSkillsSummary = candidate.skills.map(s => 
    `${s.name} (Level ${s.proficiency_level}/5)`
  ).join(', ');

  const candidateExperienceSummary = candidate.experience.map(exp => 
    `${exp.job_title} at ${exp.company_name} (${exp.years} years): ${exp.description}`
  ).join('\n');

  const candidateEducationSummary = candidate.education.map(edu => 
    `${edu.degree} in ${edu.field_of_study} from ${edu.institution_name}`
  ).join('\n');

  const personalityInfo = candidate.personality_analysis ? `
PERSONALITY ANALYSIS:
- Problem Solving Style: ${candidate.personality_analysis.problem_solving_style}
- Work Preference: ${candidate.personality_analysis.work_preference}
- Analytical Score: ${candidate.personality_analysis.analytical_score}/100
- Creative Score: ${candidate.personality_analysis.creative_score}/100  
- Leadership Score: ${candidate.personality_analysis.leadership_score}/100
- Teamwork Score: ${candidate.personality_analysis.teamwork_score}/100
- Key Strengths: ${candidate.personality_analysis.strengths.join(', ')}
` : 'Personality analysis not available';

  const candidateSummary = `
CANDIDATE PROFILE:
Name: ${candidate.full_name}
Current Title: ${candidate.current_job_title || 'Not specified'}
Total Experience: ${candidate.experience_years || 'Not specified'} years
Preferred Location: ${candidate.preferred_location || 'Not specified'}
Remote Preference: ${candidate.remote_preference ? 'Yes' : 'No'}

SKILLS: ${candidateSkillsSummary}

EXPERIENCE:
${candidateExperienceSummary}

EDUCATION:
${candidateEducationSummary}

${personalityInfo}
`;

  const prompt = `
Please evaluate the compatibility between this job and candidate, providing detailed scoring across all dimensions:

${jobSummary}

${candidateSummary}

Analyze the match quality considering:
1. Technical skills alignment and proficiency levels
2. Experience relevance and career progression fit
3. Cultural alignment and work style compatibility  
4. Personality traits alignment with role requirements
5. Location and remote work preferences

Provide specific, actionable insights in your analysis.
`;

  return withRateLimit(() => 
    generateStructuredResponse<MatchScoreResult>(
      prompt,
      systemContext,
      matchScoreSchema
    )
  );
}

/**
 * Batch calculate match scores for multiple candidates
 */
export async function calculateBatchMatchScores(
  job: JobData,
  candidates: CandidateData[]
): Promise<Array<{candidate: CandidateData; result: AIResponse<MatchScoreResult>}>> {
  const results = [];
  
  // Process candidates in batches to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async candidate => ({
      candidate,
      result: await calculateMatchScore(job, candidate)
    }));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to be respectful of API limits
    if (i + batchSize < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Quick match score estimation (lighter weight, for real-time usage)
 */
export async function getQuickMatchScore(
  jobTitle: string,
  jobRequirements: string,
  candidateSkills: string[],
  candidateExperience: string
): Promise<number> {
  const systemContext = `You are a quick job-candidate matcher. Provide only a single number from 0-100 representing match quality.`;
  
  const prompt = `
Job: ${jobTitle}
Requirements: ${jobRequirements}
Candidate Skills: ${candidateSkills.join(', ')}
Experience: ${candidateExperience}

Match score (0-100 only):`;

  try {
    const result = await generateStructuredResponse<{score: number}>(
      prompt,
      systemContext,
      {score: "number 0-100"}
    );
    
    return result.success && result.data ? result.data.score : 50;
  } catch {
    return 50; // Fallback score
  }
}