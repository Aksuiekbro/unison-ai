import { NextRequest, NextResponse } from 'next/server'
import { parseAndValidateResume } from '@/lib/ai/resume-parser'
import { supabase } from '@/lib/supabase-client'

// Helper function to extract text from different file types
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  
  if (fileType === 'application/pdf') {
    // For PDF files, we'll use a simple approach
    // In production, you might want to use pdf-parse or similar library
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Basic text extraction - this is simplified
    // For production use, implement proper PDF text extraction
    const text = new TextDecoder().decode(uint8Array)
    return text
  } else if (
    fileType === 'application/msword' || 
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // For Word documents, we'll extract text
    // In production, you might want to use mammoth.js or similar
    const arrayBuffer = await file.arrayBuffer()
    const text = new TextDecoder().decode(arrayBuffer)
    return text
  } else {
    throw new Error('Unsupported file type')
  }
}

// Simple text extraction for demo purposes
function simpleTextExtraction(buffer: ArrayBuffer): string {
  // This is a very basic approach - extract readable text
  const uint8Array = new Uint8Array(buffer)
  let text = ''
  
  for (let i = 0; i < uint8Array.length; i++) {
    const char = uint8Array[i]
    // Only include printable ASCII characters and common punctuation
    if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
      text += String.fromCharCode(char)
    } else if (char === 0) {
      text += ' ' // Replace null bytes with spaces
    }
  }
  
  // Clean up the text
  return text
    .replace(/\0+/g, ' ') // Replace null bytes
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('resume') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload PDF or Word document' },
        { status: 400 }
      )
    }

    console.log('Processing resume:', file.name, file.type, file.size)

    // Extract text from file
    let resumeText: string
    try {
      const arrayBuffer = await file.arrayBuffer()
      resumeText = simpleTextExtraction(arrayBuffer)
      
      if (resumeText.length < 100) {
        return NextResponse.json(
          { success: false, error: 'Could not extract enough text from the resume. Please try a different format.' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Text extraction error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from file' },
        { status: 500 }
      )
    }

    console.log('Extracted text length:', resumeText.length)

    // Parse resume using AI
    const parseResult = await parseAndValidateResume(resumeText, file.name)

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error },
        { status: 500 }
      )
    }

    // Store parsing result in database
    try {
      // First, delete any existing parsing result for this user
      await supabase
        .from('resume_parsing_results')
        .delete()
        .eq('user_id', userId)

      // Insert new parsing result
      const { error: insertError } = await supabase
        .from('resume_parsing_results')
        .insert({
          user_id: userId,
          original_filename: file.name,
          file_type: file.type,
          extracted_data: parseResult.data,
          parsing_success: true,
          ai_confidence_score: parseResult.confidence,
          processing_time_seconds: Math.floor(Date.now() / 1000) // Simple timestamp
        })

      if (insertError) {
        console.error('Database insert error:', insertError)
        // Continue anyway - don't fail the request if DB insert fails
      }

      // Update user profile with parsed data if needed
      const parsedData = parseResult.data!
      if (parsedData.personal_info) {
        const profileUpdate: any = {
          resume_parsed: true
        }

        // Only update fields that aren't already set
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (!existingProfile) {
          // Create profile if it doesn't exist
          const { error: profileCreateError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              resume_parsed: true,
              resume_url: null, // Could store file URL if needed
              linkedin_url: parsedData.personal_info.linkedin_url,
              github_url: parsedData.personal_info.github_url,
              portfolio_url: parsedData.personal_info.portfolio_url,
              experience_years: parsedData.experience?.length || null
            })

          if (profileCreateError) {
            console.error('Profile creation error:', profileCreateError)
          }
        } else {
          // Update existing profile
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('user_id', userId)

          if (profileUpdateError) {
            console.error('Profile update error:', profileUpdateError)
          }
        }
      }

    } catch (dbError) {
      console.error('Database operation error:', dbError)
      // Don't fail the request - parsing was successful
    }

    return NextResponse.json({
      success: true,
      data: parseResult.data,
      message: 'Resume parsed successfully'
    })

  } catch (error) {
    console.error('Resume parsing error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process resume' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}