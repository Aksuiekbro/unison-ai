import { generateStructuredResponse, withRateLimit, AIResponse } from './gemini';

export interface ResumeParsingResult {
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
  };
  professional_summary: string;
  experience: Array<{
    job_title: string;
    company_name: string;
    start_date: string; // YYYY-MM format
    end_date?: string; // YYYY-MM format, null if current
    is_current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution_name: string;
    degree: string;
    field_of_study: string;
    start_date: string; // YYYY-MM format
    end_date?: string; // YYYY-MM format
    is_current: boolean;
    gpa?: string;
    achievements: string[];
  }>;
  skills: Array<{
    name: string;
    category: 'technical' | 'soft' | 'language' | 'other';
    proficiency_level: 1 | 2 | 3 | 4 | 5; // 1=beginner, 5=expert
  }>;
  languages: Array<{
    name: string;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native';
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date_obtained?: string;
    expiry_date?: string;
  }>;
  additional_info: {
    desired_salary_range?: {
      min: number;
      max: number;
    };
    preferred_location?: string;
    remote_preference?: boolean;
    availability?: string;
  };
  confidence_scores: {
    overall: number; // 0-1
    personal_info: number;
    experience: number;
    education: number;
    skills: number;
  };
}

const resumeParsingSchema = {
  personal_info: {
    full_name: "string",
    email: "string",
    phone: "string", 
    location: "string",
    linkedin_url: "string (optional)",
    github_url: "string (optional)",
    portfolio_url: "string (optional)"
  },
  professional_summary: "string",
  experience: [
    {
      job_title: "string",
      company_name: "string",
      start_date: "string (YYYY-MM format)",
      end_date: "string (YYYY-MM format, null if current)",
      is_current: "boolean",
      description: "string",
      achievements: ["array of strings"]
    }
  ],
  education: [
    {
      institution_name: "string",
      degree: "string", 
      field_of_study: "string",
      start_date: "string (YYYY-MM format)",
      end_date: "string (YYYY-MM format, null if current)",
      is_current: "boolean",
      gpa: "string (optional)",
      achievements: ["array of strings"]
    }
  ],
  skills: [
    {
      name: "string",
      category: "technical|soft|language|other",
      proficiency_level: "number 1-5"
    }
  ],
  languages: [
    {
      name: "string",
      proficiency: "beginner|intermediate|advanced|native"
    }
  ],
  certifications: [
    {
      name: "string",
      issuer: "string",
      date_obtained: "string (optional)",
      expiry_date: "string (optional)"
    }
  ],
  additional_info: {
    desired_salary_range: {
      min: "number (optional)",
      max: "number (optional)"
    },
    preferred_location: "string (optional)",
    remote_preference: "boolean (optional)",
    availability: "string (optional)"
  },
  confidence_scores: {
    overall: "number 0-1",
    personal_info: "number 0-1",
    experience: "number 0-1", 
    education: "number 0-1",
    skills: "number 0-1"
  }
};

/**
 * Parse resume content using AI to extract structured data
 */
export async function parseResumeWithAI(
  resumeText: string,
  filename?: string
): Promise<AIResponse<ResumeParsingResult>> {
  const systemContext = `
You are an expert resume parser. Your task is to extract structured information from resume text with high accuracy.

Guidelines:
- Extract all available information, but don't fabricate missing data
- For dates, use YYYY-MM format (e.g., "2023-01", "2020-12")
- If exact dates aren't available, estimate based on context
- Categorize skills appropriately (technical, soft, language, other)
- Assign realistic proficiency levels based on context clues
- Calculate confidence scores based on data clarity and completeness
- For achievements, extract specific accomplishments, metrics, and results
- If salary or location preferences aren't mentioned, leave them empty
- Be conservative with confidence scores - only high scores for very clear data

Focus on accuracy over completeness.
`;

  const prompt = `
Please parse the following resume content and extract structured information:

${filename ? `Filename: ${filename}` : ''}

Resume Content:
${resumeText}

Extract all relevant information according to the specified schema, ensuring accuracy and appropriate confidence scoring.
`;

  return withRateLimit(() => 
    generateStructuredResponse<ResumeParsingResult>(
      prompt,
      systemContext,
      resumeParsingSchema
    )
  );
}

/**
 * Enhanced resume parsing with validation and cleanup
 */
export async function parseAndValidateResume(
  resumeText: string,
  filename?: string
): Promise<AIResponse<ResumeParsingResult>> {
  const result = await parseResumeWithAI(resumeText, filename);
  
  if (!result.success || !result.data) {
    return result;
  }

  // Validate and clean the parsed data
  const data = result.data;
  
  // Validate required fields
  if (!data.personal_info?.full_name || !data.personal_info?.email) {
    return {
      success: false,
      error: 'Missing required personal information (name or email)'
    };
  }

  // Clean and validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.personal_info.email)) {
    return {
      success: false,
      error: 'Invalid email format detected'
    };
  }

  // Ensure experience dates are properly formatted
  if (data.experience) {
    data.experience = data.experience.map(exp => ({
      ...exp,
      is_current: exp.is_current || !exp.end_date,
      achievements: exp.achievements || []
    }));
  }

  // Ensure education dates are properly formatted
  if (data.education) {
    data.education = data.education.map(edu => ({
      ...edu,
      is_current: edu.is_current || !edu.end_date,
      achievements: edu.achievements || []
    }));
  }

  // Set default values for confidence scores if missing
  if (!data.confidence_scores) {
    data.confidence_scores = {
      overall: 0.7,
      personal_info: 0.8,
      experience: 0.7,
      education: 0.7,
      skills: 0.6
    };
  }

  return {
    success: true,
    data,
    confidence: data.confidence_scores.overall
  };
}