import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client safely
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your-gemini-api-key-here' && apiKey.length > 10) {
    genAI = new GoogleGenerativeAI(apiKey);
    const modelName = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
    model = genAI.getGenerativeModel({ model: modelName });
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
 * Supports both text and file inputs
 */
export async function generateStructuredResponse<T>(
  prompt: string,
  systemContext: string,
  schema: any,
  fileData?: {
    buffer: Buffer;
    mimeType: string;
    filename?: string;
  }
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

CRITICAL: Respond with valid JSON only. Follow this exact schema:
${JSON.stringify(schema, null, 2)}

JSON Requirements:
- Output ONLY the JSON object, no markdown code blocks
- Escape all special characters properly (quotes as \\", newlines as \\n)
- Do not include any text before or after the JSON
- Ensure all string values are properly quoted and escaped
`;

    let result;
    if (fileData) {
      // Convert buffer to base64 for file upload
      const base64Data = fileData.buffer.toString('base64');
      const filePart = {
        inlineData: {
          data: base64Data,
          mimeType: fileData.mimeType
        }
      };
      
      result = await model.generateContent([fullPrompt, filePart]);
    } else {
      result = await model.generateContent(fullPrompt);
    }
    const response = await result.response;
    const text = response.text().trim();

    // Clean up the response to ensure it's valid JSON
    let cleanText = text;
    
    // Remove markdown code blocks more thoroughly
    // Handle various forms: ```json, ```JSON, ``` with or without newlines
    cleanText = cleanText
      .replace(/^```(?:json|JSON)?\s*\n?/i, '')
      .replace(/\n?```\s*$/g, '')
      .trim();
    
    // If it still starts with ``` somewhere, try to extract just the JSON
    if (cleanText.includes('```')) {
      const jsonMatch = cleanText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
      if (jsonMatch && jsonMatch[1]) {
        cleanText = jsonMatch[1].trim();
      }
    }

    try {
      const parsedData = JSON.parse(cleanText);
      return {
        success: true,
        data: parsedData,
        confidence: 0.85 // Default confidence score
      };
    } catch (parseError) {
      // Attempt to fix common JSON issues
      try {
        // Try to fix unescaped control characters in strings
        let fixedText = cleanText
          // Replace unescaped newlines inside strings
          .replace(/(?<=":[ ]*"[^"]*)\n(?=[^"]*")/g, '\\n')
          // Replace unescaped tabs inside strings
          .replace(/(?<=":[ ]*"[^"]*)\t(?=[^"]*")/g, '\\t');
        
        const parsedData = JSON.parse(fixedText);
        console.warn('JSON parsing succeeded after auto-fix');
        return {
          success: true,
          data: parsedData,
          confidence: 0.75 // Lower confidence due to fix needed
        };
      } catch {
        // If still failing, try a more aggressive cleanup
        try {
          // Extract JSON object from response using regex
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            console.warn('JSON parsing succeeded after regex extraction');
            return {
              success: true,
              data: parsedData,
              confidence: 0.7
            };
          }
        } catch {
          // Final fallback failed
        }
        
        console.error('Failed to parse AI response as JSON:', parseError);
        console.error('Raw response:', text);
        return {
          success: false,
          error: `Invalid JSON response from AI: ${parseError}`
        };
      }
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