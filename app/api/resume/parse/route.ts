import { NextRequest, NextResponse } from 'next/server'
import { parseAndValidateResume } from '@/lib/ai/resume-parser'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

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
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('resume') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
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
        .eq('user_id', user.id)

      // Insert new parsing result
      const { error: insertError } = await supabase
        .from('resume_parsing_results')
        .insert({
          user_id: user.id,
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
        // Update user with parsed data (single table approach)
        const userUpdate: any = {}
        
        // Get existing user data to avoid overwriting
        const { data: existingUser } = await supabase
          .from('users')
          .select('full_name, phone, location, linkedin_url, github_url, portfolio_url, experiences, educations')
          .eq('id', user.id)
          .single()

        // Only update fields that aren't already set
        if (parsedData.personal_info.full_name && !existingUser?.full_name) {
          userUpdate.full_name = parsedData.personal_info.full_name
        }
        if (parsedData.personal_info.phone && !existingUser?.phone) {
          userUpdate.phone = parsedData.personal_info.phone
        }
        if (parsedData.personal_info.location && !existingUser?.location) {
          userUpdate.location = parsedData.personal_info.location
        }
        if (parsedData.personal_info.linkedin_url && !existingUser?.linkedin_url) {
          userUpdate.linkedin_url = parsedData.personal_info.linkedin_url
        }
        if (parsedData.personal_info.github_url && !existingUser?.github_url) {
          userUpdate.github_url = parsedData.personal_info.github_url
        }
        if (parsedData.personal_info.portfolio_url && !existingUser?.portfolio_url) {
          userUpdate.portfolio_url = parsedData.personal_info.portfolio_url
        }

        // Update experiences if parsed and not already set
        if (parsedData.experiences && (!existingUser?.experiences || (existingUser.experiences as any[]).length === 0)) {
          const formattedExperiences = (parsedData.experiences as any[]).map(exp => ({
            id: crypto.randomUUID(),
            position: exp.job_title || exp.position,
            company: exp.company_name || exp.company,
            startDate: exp.start_date || exp.startDate,
            endDate: exp.end_date || exp.endDate,
            description: exp.description,
            isCurrent: exp.is_current || exp.isCurrent || false
          }))
          userUpdate.experiences = formattedExperiences
        }

        // Update educations if parsed and not already set
        if (parsedData.educations && (!existingUser?.educations || (existingUser.educations as any[]).length === 0)) {
          const formattedEducations = (parsedData.educations as any[]).map(edu => ({
            id: crypto.randomUUID(),
            institution: edu.institution_name || edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.field_of_study || edu.fieldOfStudy,
            graduationYear: edu.graduation_year || edu.graduationYear || (edu.end_date ? new Date(edu.end_date).getFullYear() : undefined)
          }))
          userUpdate.educations = formattedEducations
        }

        if (Object.keys(userUpdate).length > 0) {
          const { error: userUpdateError } = await supabase
            .from('users')
            .update(userUpdate)
            .eq('id', user.id)

          if (userUpdateError) {
            console.error('User update error:', userUpdateError)
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