import { generateStructuredResponse, withRateLimit, AIResponse } from './gemini';

export interface ProductivityScoreResult {
  overall_productivity_score: number; // 0-100 integer
  probation_recommendation: 'yes' | 'no' | 'never_consider';
  assessor_notes: string;
  confidence_score: number; // 0-1
}

const productivityScoreSchema = {
  overall_productivity_score: 'number 0-100 integer - overall productivity potential score',
  probation_recommendation: "string enum: 'yes' | 'no' | 'never_consider' - recommendation for probation",
  assessor_notes: 'string - concise 2-3 sentence rationale for the score and recommendation',
  confidence_score: 'number 0-1 - AI confidence in this analysis',
};

export interface ProductivityInput {
  work_experiences: Array<{
    company_name: string;
    position: string;
    start_date: string;
    end_date?: string;
    is_current?: boolean;
    work_duration?: string;
    reason_for_leaving?: string;
    functions_performed?: string;
    work_products?: string;
    result_measurement?: string;
    product_timeline?: string;
    team_comparison_score?: number; // 1-5
    workload_change_over_time?: string;
    responsibility_evolution?: string;
    key_achievements?: string;
  }>;
  knowledge_assessment: {
    recent_learning_activities?: string;
    professional_development?: string;
    future_learning_goals?: string;
  };
  personal_info: {
    role_type?: 'manager' | 'specialist';
    motivation_level?: number; // 1-4
    minimum_salary_requirement?: number;
    residence_location?: string;
  };
}

/**
 * Use Gemini to estimate a candidate's productivity score and recommendation
 */
export async function scoreProductivity(
  input: ProductivityInput
): Promise<AIResponse<ProductivityScoreResult>> {
  const systemContext = `
You are a senior HR productivity analyst. Evaluate a candidate's productivity potential and hiring recommendation.

Guidelines:
- Base scoring primarily on concrete work outcomes, responsibilities growth, and comparative performance (team_comparison_score 1-5 when present).
- Consider evidence of learning velocity and professional development.
- Motivation context (1=money, 2=personal_benefit, 3=personal_conviction, 4=duty) can influence recommendation but should not dominate the score.
- Be concise and strictly return valid JSON as per schema.
`;

  const expLines = input.work_experiences.map((exp, idx) => {
    const parts = [
      `#${idx + 1} ${exp.position} @ ${exp.company_name}`,
      `period=${exp.start_date}${exp.end_date ? '→' + exp.end_date : ''}${exp.is_current ? ' (current)' : ''}`,
      exp.functions_performed ? `functions=${exp.functions_performed}` : undefined,
      exp.work_products ? `products=${exp.work_products}` : undefined,
      exp.result_measurement ? `measurement=${exp.result_measurement}` : undefined,
      exp.product_timeline ? `timeline=${exp.product_timeline}` : undefined,
      typeof exp.team_comparison_score === 'number' ? `team_score=${exp.team_comparison_score}/5` : undefined,
      exp.workload_change_over_time ? `workload_change=${exp.workload_change_over_time}` : undefined,
      exp.responsibility_evolution ? `responsibility_change=${exp.responsibility_evolution}` : undefined,
      exp.key_achievements ? `achievements=${exp.key_achievements}` : undefined,
    ].filter(Boolean);
    return parts.join(' | ');
  }).join('\n');

  const knowledge = input.knowledge_assessment;
  const personal = input.personal_info;

  const prompt = `
CANDIDATE DATA

WORK EXPERIENCES:\n${expLines || 'N/A'}

KNOWLEDGE / LEARNING:
- recent_learning: ${knowledge.recent_learning_activities || 'N/A'}
- professional_development: ${knowledge.professional_development || 'N/A'}
- future_learning_goals: ${knowledge.future_learning_goals || 'N/A'}

PERSONAL CONTEXT:
- role_type: ${personal.role_type || 'unspecified'}
- motivation_level: ${personal.motivation_level || 'unspecified'}
- min_salary: ${personal.minimum_salary_requirement ?? 'unspecified'}
- location: ${personal.residence_location || 'unspecified'}

Task: Estimate the candidate's overall productivity potential (0-100) and a probation recommendation.
Return strictly valid JSON following the provided schema.
`;

  return withRateLimit(() => (
    generateStructuredResponse<ProductivityScoreResult>(
      prompt,
      systemContext,
      productivityScoreSchema
    )
  ));
}

export default scoreProductivity;


