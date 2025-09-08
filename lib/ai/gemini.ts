import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client safely
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your-gemini-api-key-here' && apiKey.length > 10) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
} catch (error) {
  console.warn('Gemini AI initialization failed:', error);
}

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
}

/**
 * Base function to interact with Gemini AI with structured JSON responses
 */
export async function generateStructuredResponse<T>(
  prompt: string,
  systemContext: string,
  schema: any
): Promise<AIResponse<T>> {
  try {
    // Check if AI model is available
    if (!model) {
      return {
        success: false,
        error: 'Gemini AI is not properly configured. Please check your GEMINI_API_KEY environment variable.'
      };
    }

    const fullPrompt = `
${systemContext}

${prompt}

Please respond with valid JSON only, following this exact schema:
${JSON.stringify(schema, null, 2)}

Ensure your response is valid JSON that can be parsed directly. Do not include any text outside the JSON structure.
`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text().trim();

    // Clean up the response to ensure it's valid JSON
    let cleanText = text;
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsedData = JSON.parse(cleanText);
      return {
        success: true,
        data: parsedData,
        confidence: 0.85 // Default confidence score
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', text);
      return {
        success: false,
        error: `Invalid JSON response from AI: ${parseError}`
      };
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      success: false,
      error: `AI generation failed: ${error}`
    };
  }
}

/**
 * Rate limits and error handling wrapper
 */
export async function withRateLimit<T>(
  aiFunction: () => Promise<AIResponse<T>>,
  retries: number = 3
): Promise<AIResponse<T>> {
  let lastError: string = '';
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await aiFunction();
      if (result.success) {
        return result;
      }
      lastError = result.error || 'Unknown error';
      
      // Wait before retry (exponential backoff)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    } catch (error) {
      lastError = String(error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  return {
    success: false,
    error: `Failed after ${retries} retries: ${lastError}`
  };
}

export default model;