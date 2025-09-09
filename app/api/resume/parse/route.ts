import { NextRequest, NextResponse } from 'next/server'
import { parseAndValidateResume } from '@/lib/ai/resume-parser'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

// Proper PDF text extraction using pdf-parse with dynamic import
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdf = (await import('pdf-parse')).default
    const data = await pdf(Buffer.from(buffer))
    return data.text
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF content')
  }
}

// Helper function to extract text from different file types
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  
  if (fileType === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer()
    return await extractTextFromPDF(arrayBuffer)
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
  let fieldsUpdated: string[] = []
  
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
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

    // Try direct file processing first (preferred for PDFs)
    let parseResult
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        console.log('Using direct PDF processing with Gemini')
        parseResult = await parseAndValidateResume(buffer, file.name, file.type)
        
        if (!parseResult.success) {
          console.log('Direct PDF processing failed, falling back to text extraction')
          
          // Fallback to text extraction
          const resumeText = await extractTextFromFile(file)
          if (resumeText.length < 100) {
            return NextResponse.json(
              { success: false, error: 'Could not extract enough text from the resume. Please try a different format.' },
              { status: 400 }
            )
          }
          console.log('Extracted text length:', resumeText.length)
          parseResult = await parseAndValidateResume(resumeText, file.name)
        }
      } catch (error) {
        console.error('Direct PDF processing error:', error)
        
        // Fallback to text extraction
        try {
          const resumeText = await extractTextFromFile(file)
          if (resumeText.length < 100) {
            return NextResponse.json(
              { success: false, error: 'Could not extract enough text from the resume. Please try a different format.' },
              { status: 400 }
            )
          }
          console.log('Fallback - extracted text length:', resumeText.length)
          parseResult = await parseAndValidateResume(resumeText, file.name)
        } catch (fallbackError) {
          console.error('Fallback text extraction error:', fallbackError)
          return NextResponse.json(
            { success: false, error: 'Failed to process resume file' },
            { status: 500 }
          )
        }
      }
    } else {
      // For non-PDF files, use text extraction
      try {
        const resumeText = await extractTextFromFile(file)
        if (resumeText.length < 100) {
          return NextResponse.json(
            { success: false, error: 'Could not extract enough text from the resume. Please try a different format.' },
            { status: 400 }
          )
        }
        console.log('Extracted text length:', resumeText.length)
        parseResult = await parseAndValidateResume(resumeText, file.name)
      } catch (error) {
        console.error('Text extraction error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to extract text from file' },
          { status: 500 }
        )
      }
    }

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

      // Update user profile with parsed data - now more flexible
      const parsedData = parseResult.data!
      
      if (parsedData.personal_info) {
        // Get existing user data
        const { data: existingUser } = await supabase
          .from('users')
          .select('full_name, phone, location, linkedin_url, github_url, portfolio_url, experiences, educations')
          .eq('id', user.id)
          .single()

        const userUpdate: any = {}
        
        // Update personal info fields (be more permissive for better user experience)
        if (parsedData.personal_info.full_name && (!existingUser?.full_name || existingUser.full_name !== parsedData.personal_info.full_name)) {
          userUpdate.full_name = parsedData.personal_info.full_name
          fieldsUpdated.push('full_name')
        }
        if (parsedData.personal_info.phone && (!existingUser?.phone || existingUser.phone !== parsedData.personal_info.phone)) {
          userUpdate.phone = parsedData.personal_info.phone
          fieldsUpdated.push('phone')
        }
        if (parsedData.personal_info.location && (!existingUser?.location || existingUser.location !== parsedData.personal_info.location)) {
          userUpdate.location = parsedData.personal_info.location
          fieldsUpdated.push('location')
        }
        if (parsedData.personal_info.linkedin_url && (!existingUser?.linkedin_url || existingUser.linkedin_url !== parsedData.personal_info.linkedin_url)) {
          // Ensure LinkedIn URL has proper https:// prefix
          const linkedinUrl = parsedData.personal_info.linkedin_url.startsWith('http') 
            ? parsedData.personal_info.linkedin_url 
            : `https://${parsedData.personal_info.linkedin_url}`
          userUpdate.linkedin_url = linkedinUrl
          fieldsUpdated.push('linkedin_url')
        }
        if (parsedData.personal_info.github_url && (!existingUser?.github_url || existingUser.github_url !== parsedData.personal_info.github_url)) {
          // Ensure GitHub URL has proper https:// prefix
          const githubUrl = parsedData.personal_info.github_url.startsWith('http') 
            ? parsedData.personal_info.github_url 
            : `https://${parsedData.personal_info.github_url}`
          userUpdate.github_url = githubUrl
          fieldsUpdated.push('github_url')
        }
        if (parsedData.personal_info.portfolio_url && (!existingUser?.portfolio_url || existingUser.portfolio_url !== parsedData.personal_info.portfolio_url)) {
          // Ensure Portfolio URL has proper https:// prefix
          const portfolioUrl = parsedData.personal_info.portfolio_url.startsWith('http') 
            ? parsedData.personal_info.portfolio_url 
            : `https://${parsedData.personal_info.portfolio_url}`
          userUpdate.portfolio_url = portfolioUrl
          fieldsUpdated.push('portfolio_url')
        }

        // For experiences and educations, merge instead of replacing for better UX
        if (parsedData.experiences && parsedData.experiences.length > 0) {
          const existingExperiences = (existingUser?.experiences as any[]) || []
          const formattedExperiences = (parsedData.experiences as any[]).map(exp => ({
            id: crypto.randomUUID(),
            position: exp.job_title || exp.position,
            company: exp.company_name || exp.company,
            startDate: exp.start_date || exp.startDate,
            endDate: exp.end_date || exp.endDate,
            description: exp.description || '',
            isCurrent: exp.is_current || exp.isCurrent || false
          }))
          
          // Only add new experiences that don't already exist (basic deduplication)
          const newExperiences = formattedExperiences.filter(newExp => 
            !existingExperiences.some(existing => 
              existing.position === newExp.position && existing.company === newExp.company
            )
          )
          
          if (newExperiences.length > 0) {
            userUpdate.experiences = [...existingExperiences, ...newExperiences]
            fieldsUpdated.push(`experiences (+${newExperiences.length})`)
          }
        }

        if (parsedData.educations && parsedData.educations.length > 0) {
          const existingEducations = (existingUser?.educations as any[]) || []
          const formattedEducations = (parsedData.educations as any[]).map(edu => ({
            id: crypto.randomUUID(),
            institution: edu.institution_name || edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.field_of_study || edu.fieldOfStudy,
            graduationYear: edu.graduation_year || edu.graduationYear || (edu.end_date ? new Date(edu.end_date).getFullYear() : undefined)
          }))
          
          // Only add new education that doesn't already exist (basic deduplication)
          const newEducations = formattedEducations.filter(newEdu => 
            !existingEducations.some(existing => 
              existing.institution === newEdu.institution && existing.degree === newEdu.degree
            )
          )
          
          if (newEducations.length > 0) {
            userUpdate.educations = [...existingEducations, ...newEducations]
            fieldsUpdated.push(`educations (+${newEducations.length})`)
          }
        }

        if (Object.keys(userUpdate).length > 0) {
          console.log('🤖 AI Processing - About to update user profile:', JSON.stringify(userUpdate, null, 2))
          console.log('🤖 AI Processing - User ID:', user.id)
          
          const { error: userUpdateError, data: updateResult } = await supabase
            .from('users')
            .update(userUpdate)
            .eq('id', user.id)
            .select()

          if (userUpdateError) {
            console.error('❌ AI Processing - User update error:', userUpdateError)
          } else {
            console.log('✅ AI Processing - Updated fields:', fieldsUpdated.join(', '))
            console.log('✅ AI Processing - Database result:', updateResult)
          }
        } else {
          console.log('🤖 AI Processing - No fields to update (userUpdate is empty)')
        }
      }

    } catch (dbError) {
      console.error('Database operation error:', dbError)
      // Don't fail the request - parsing was successful
    }

    return NextResponse.json({
      success: true,
      data: parseResult.data,
      message: 'Resume parsed successfully',
      fieldsUpdated: fieldsUpdated.length > 0 ? fieldsUpdated : null
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