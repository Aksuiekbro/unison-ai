import { generateStructuredResponse, withRateLimit, AIResponse } from './gemini';

export interface PersonalityAnalysisResult {
  problem_solving_style: string;
  initiative_level: string;
  work_preference: string;
  motivational_factors: string;
  growth_areas: string;
  communication_style: string;
  leadership_potential: string;
  
  // Quantified scores (0-100)
  analytical_score: number;
  creative_score: number;
  leadership_score: number;
  teamwork_score: number;
  
  // Overall assessment
  personality_summary: string;
  strengths: string[];
  development_areas: string[];
  ideal_work_environment: string;
  
  // AI metadata
  confidence_score: number; // 0-1
  analysis_notes: string;
}

export interface QuestionResponse {
  question_id: string;
  question_text: string;
  response_text: string;
  category?: string;
}

const personalityAnalysisSchema = {
  problem_solving_style: "string - detailed description of how the person approaches problems",
  initiative_level: "string - assessment of proactiveness and self-motivation",
  work_preference: "string - whether they prefer team collaboration or individual work",
  motivational_factors: "string - what drives and motivates this person",
  growth_areas: "string - areas where the person could improve or develop",
  communication_style: "string - how they prefer to communicate and interact",
  leadership_potential: "string - assessment of leadership capabilities and style",
  
  analytical_score: "number 0-100 - quantified analytical thinking ability",
  creative_score: "number 0-100 - quantified creative problem-solving ability", 
  leadership_score: "number 0-100 - quantified leadership potential",
  teamwork_score: "number 0-100 - quantified collaboration and teamwork skills",
  
  personality_summary: "string - comprehensive 2-3 sentence personality overview",
  strengths: ["array of strings - key personality strengths"],
  development_areas: ["array of strings - areas for growth and improvement"],
  ideal_work_environment: "string - description of optimal work setting for this person",
  
  confidence_score: "number 0-1 - AI confidence in this analysis",
  analysis_notes: "string - any additional insights or caveats"
};

/**
 * Analyze personality based on questionnaire responses
 */
export async function analyzePersonality(
  responses: QuestionResponse[]
): Promise<AIResponse<PersonalityAnalysisResult>> {
  if (!responses || responses.length === 0) {
    return {
      success: false,
      error: 'No questionnaire responses provided'
    };
  }

  const systemContext = `
You are an expert personality assessor specializing in workplace psychology and soft skills evaluation. Your task is to analyze questionnaire responses to provide insights into a person's work personality, behavioral patterns, and professional capabilities.

Analysis Guidelines:
- Base your assessment solely on the provided responses
- Look for patterns across multiple responses to increase confidence
- Be specific and actionable in your descriptions
- Focus on workplace-relevant personality traits
- Provide balanced assessment including both strengths and areas for growth
- Use evidence from responses to support your conclusions
- Assign quantified scores (0-100) based on clear evidence from responses
- Be honest about confidence levels - lower confidence if responses are brief or unclear
- Consider cultural context and avoid bias
- Focus on behavioral tendencies rather than making definitive character judgments

Scoring Guidelines:
- Analytical Score: Evidence of logical thinking, problem-solving approach, data-driven decisions
- Creative Score: Signs of innovative thinking, creative problem-solving, novel approaches
- Leadership Score: Initiative-taking, influence on others, decision-making confidence
- Teamwork Score: Collaboration mentions, team-oriented thinking, interpersonal skills

Confidence Scoring:
- High confidence (0.8-1.0): Multiple consistent responses with detailed examples
- Medium confidence (0.5-0.8): Some clear patterns but limited detail or mixed signals
- Low confidence (0.0-0.5): Brief responses, unclear patterns, or contradictory information
`;

  const responsesText = responses.map((r, index) => 
    `Question ${index + 1} (${r.category || 'general'}): ${r.question_text}
Response: ${r.response_text}
`
  ).join('\n');

  const prompt = `
Please analyze the following questionnaire responses to assess the person's workplace personality and soft skills:

${responsesText}

Provide a comprehensive personality analysis focusing on workplace behavior, collaboration style, problem-solving approach, and professional development areas. Base your assessment on evidence from the responses and be specific about confidence levels.
`;

  return withRateLimit(() => 
    generateStructuredResponse<PersonalityAnalysisResult>(
      prompt,
      systemContext,
      personalityAnalysisSchema
    )
  );
}

/**
 * Validate and enhance personality analysis results
 */
export async function validatePersonalityAnalysis(
  result: PersonalityAnalysisResult
): Promise<{valid: boolean; errors: string[]}> {
  const errors: string[] = [];

  // Check required fields
  const requiredFields = [
    'problem_solving_style',
    'initiative_level', 
    'work_preference',
    'motivational_factors',
    'personality_summary'
  ];

  for (const field of requiredFields) {
    if (!result[field as keyof PersonalityAnalysisResult] || 
        String(result[field as keyof PersonalityAnalysisResult]).trim().length < 10) {
      errors.push(`Missing or insufficient ${field}`);
    }
  }

  // Validate score ranges
  const scores = ['analytical_score', 'creative_score', 'leadership_score', 'teamwork_score'];
  for (const score of scores) {
    const value = result[score as keyof PersonalityAnalysisResult] as number;
    if (typeof value !== 'number' || value < 0 || value > 100) {
      errors.push(`Invalid ${score}: must be a number between 0-100`);
    }
  }

  // Validate confidence score
  if (typeof result.confidence_score !== 'number' || 
      result.confidence_score < 0 || result.confidence_score > 1) {
    errors.push('Invalid confidence_score: must be a number between 0-1');
  }

  // Validate arrays
  if (!Array.isArray(result.strengths) || result.strengths.length === 0) {
    errors.push('Strengths must be a non-empty array');
  }

  if (!Array.isArray(result.development_areas) || result.development_areas.length === 0) {
    errors.push('Development areas must be a non-empty array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate personality summary for display
 */
export function formatPersonalitySummary(analysis: PersonalityAnalysisResult): string {
  const scores = {
    analytical: analysis.analytical_score,
    creative: analysis.creative_score,
    leadership: analysis.leadership_score,
    teamwork: analysis.teamwork_score
  };

  const topStrengths = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([key]) => key);

  return `${analysis.personality_summary} Key strengths include ${topStrengths.join(' and ')} capabilities, with ${analysis.work_preference.toLowerCase()} work preferences.`;
}