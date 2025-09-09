'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
// Using untyped client to avoid friction with partially generated DB types
import { 
  jobSeekerProfileSchema,
  jobSeekerExperienceSchema,
  jobSeekerEducationSchema,
  employerProfileSchema,
  type JobSeekerProfileData,
  type JobSeekerExperienceData,
  type JobSeekerEducationData,
  type EmployerProfileData
} from '@/lib/validations'

// Job Seeker Actions
export async function updateJobSeekerProfile(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  
  try {
    let aiProcessingResult = null
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Get user data to verify role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'job_seeker') {
      return { error: 'Job seeker not found' }
    }

    // Parse form data
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      title: formData.get('title') as string,
      summary: formData.get('summary') as string,
      phone: formData.get('phone') as string,
      location: formData.get('location') as string,
      linkedinUrl: formData.get('linkedinUrl') as string,
      githubUrl: formData.get('githubUrl') as string,
      skills: formData.get('skills') ? JSON.parse(formData.get('skills') as string) : [],
    }

    // Validate data
    const validatedData = jobSeekerProfileSchema.parse(data)

    // Optional: upload resume to storage if provided
    let resumeUrl: string | null = null
    const resumeFile = formData.get('resume') as File | null
    if (resumeFile && typeof (resumeFile as any).arrayBuffer === 'function' && resumeFile.size > 0) {
      const filePath = `${user.id}/resume-${Date.now()}-${resumeFile.name}`
      const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, resumeFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: resumeFile.type || 'application/octet-stream',
      })
      if (uploadError) {
        console.error('Resume upload failed:', uploadError)
        // Non-fatal: continue saving profile fields
      } else {
        const { data: pub } = await supabase.storage.from('resumes').getPublicUrl(filePath)
        resumeUrl = pub?.publicUrl || null
        
        // Process resume with AI after successful upload
        try {
          const parseFormData = new FormData()
          parseFormData.append('resume', resumeFile)
          
          const parseResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/resume/parse`, {
            method: 'POST',
            body: parseFormData,
            headers: {
              'Cookie': (await cookies()).toString()
            }
          })
          
          if (parseResponse.ok) {
            const parseResult = await parseResponse.json()
            console.log('Resume AI processing result:', parseResult)
            aiProcessingResult = parseResult
            if (parseResult.fieldsUpdated) {
              console.log('AI updated fields:', parseResult.fieldsUpdated)
            }
          } else {
            console.error('Resume AI processing failed:', await parseResponse.text())
          }
        } catch (parseError) {
          console.error('Failed to process resume with AI:', parseError)
          // Non-fatal: continue with profile update
        }
      }
    }

    // Update users table with all profile info (simplified single-table approach)
    // IMPORTANT: Don't overwrite fields that were just updated by AI processing
    const updateData: any = {
      resume_url: resumeUrl,
    }

    // Get list of fields that were updated by AI in this request
    const aiUpdatedFields = (aiProcessingResult?.fieldsUpdated || []) as string[]
    console.log('📝 Profile Action - AI updated these fields, will not overwrite:', aiUpdatedFields)

    // Only add fields to update if they have actual data AND weren't updated by AI
    if ((validatedData.firstName || validatedData.lastName) && !aiUpdatedFields.includes('full_name')) {
      const fullName = `${validatedData.firstName} ${validatedData.lastName}`.trim()
      if (fullName) {
        updateData.full_name = fullName
      }
    }
    
    if (validatedData.phone?.trim() && !aiUpdatedFields.includes('phone')) {
      updateData.phone = validatedData.phone
    }
    
    if (validatedData.location?.trim() && !aiUpdatedFields.includes('location')) {
      updateData.location = validatedData.location
    }
    
    if (validatedData.summary?.trim() && !aiUpdatedFields.includes('bio')) {
      updateData.bio = validatedData.summary
    }
    
    if (validatedData.title?.trim() && !aiUpdatedFields.includes('current_job_title')) {
      updateData.current_job_title = validatedData.title
    }
    
    if (validatedData.linkedinUrl?.trim() && !aiUpdatedFields.includes('linkedin_url')) {
      const normalized = !/^https?:\/\//i.test(validatedData.linkedinUrl) ? 
        `https://${validatedData.linkedinUrl}` : validatedData.linkedinUrl
      updateData.linkedin_url = normalized
    }
    
    if (validatedData.githubUrl?.trim() && !aiUpdatedFields.includes('github_url')) {
      const normalized = !/^https?:\/\//i.test(validatedData.githubUrl) ? 
        `https://${validatedData.githubUrl}` : validatedData.githubUrl
      updateData.github_url = normalized
    }

    // Handle skills - always update from form state (which includes AI-extracted + manually added)
    // Only skip if AI processing just updated skills in this same request
    if (!aiUpdatedFields.includes('skills')) {
      updateData.skills = validatedData.skills || []
    }

    // Note: portfolio_url is handled by AI processing, form doesn't have this field

    console.log('📝 Profile Action - Updating database with data:', JSON.stringify(updateData, null, 2))
    console.log('📝 Profile Action - User ID:', user.id)
    console.log('📝 Profile Action - AI Processing Result:', aiProcessingResult ? 'Present' : 'Not available')
    
    if (aiProcessingResult && aiProcessingResult.fieldsUpdated) {
      console.log('📝 Profile Action - AI previously updated fields:', aiProcessingResult.fieldsUpdated)
    }

    const { error: usersUpdateError, data: updateResult } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()

    if (usersUpdateError) {
      console.error('❌ Error updating user profile:', usersUpdateError)
      return { error: `Failed to update profile: ${usersUpdateError.message}` }
    }

    console.log('✅ Profile Action - Database update successful:', updateResult)

    // All profile data now stored in users table - simplified single-table approach

    revalidatePath('/job-seeker/profile')
    revalidatePath('/job-seeker/dashboard')
    return { 
      success: true,
      aiResponse: aiProcessingResult 
    }

  } catch (error: any) {
    console.error('Error in updateJobSeekerProfile:', error)
    return { error: `Invalid form data: ${error?.message || 'Unknown error'}` }
  }
}

export async function addJobSeekerExperience(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Verify job seeker role and get current experiences
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, experiences')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'job_seeker') {
      return { error: 'Job seeker not found' }
    }

    // Parse form data
    const data = {
      position: formData.get('position') as string,
      company: formData.get('company') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      description: formData.get('description') as string,
      isCurrent: formData.get('isCurrent') === 'true',
    }

    // Validate data
    const validatedData = jobSeekerExperienceSchema.parse(data)

    // Get current experiences array and add new experience
    const currentExperiences = (userData.experiences as any[]) || []
    const newExperience = {
      id: crypto.randomUUID(),
      position: validatedData.position,
      company: validatedData.company,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate || undefined,
      description: validatedData.description || undefined,
      isCurrent: validatedData.isCurrent,
    }
    
    const updatedExperiences = [...currentExperiences, newExperience]

    // Update experiences JSON array in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ experiences: updatedExperiences })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error adding experience:', updateError)
      return { error: 'Failed to add experience' }
    }

    revalidatePath('/job-seeker/profile')
    return { success: true }

  } catch (error) {
    console.error('Error in addJobSeekerExperience:', error)
    return { error: 'Invalid form data' }
  }
}

export async function addJobSeekerEducation(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Verify job seeker role and get current educations
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, educations')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'job_seeker') {
      return { error: 'Job seeker not found' }
    }

    // Parse form data
    const data = {
      institution: formData.get('institution') as string,
      degree: formData.get('degree') as string,
      fieldOfStudy: formData.get('fieldOfStudy') as string,
      graduationYear: parseInt(formData.get('graduationYear') as string),
    }

    // Validate data
    const validatedData = jobSeekerEducationSchema.parse(data)

    // Get current educations array and add new education
    const currentEducations = (userData.educations as any[]) || []
    const newEducation = {
      id: crypto.randomUUID(),
      institution: validatedData.institution,
      degree: validatedData.degree,
      fieldOfStudy: validatedData.fieldOfStudy,
      graduationYear: validatedData.graduationYear,
    }
    
    const updatedEducations = [...currentEducations, newEducation]

    // Update educations JSON array in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ educations: updatedEducations })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error adding education:', updateError)
      return { error: 'Failed to add education' }
    }

    revalidatePath('/job-seeker/profile')
    return { success: true }

  } catch (error) {
    console.error('Error in addJobSeekerEducation:', error)
    return { error: 'Invalid form data' }
  }
}

// Employer Actions
export async function updateEmployerProfile(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Verify employer role using users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'employer') {
      return { error: 'Employer not found' }
    }

    // Parse form data
    const data = {
      companyName: formData.get('companyName') as string,
      companyDescription: formData.get('companyDescription') as string,
      industry: formData.get('industry') as string,
      companySize: formData.get('companySize') as string,
      foundedYear: formData.get('foundedYear') ? parseInt(formData.get('foundedYear') as string) : undefined,
      websiteUrl: formData.get('websiteUrl') as string,
      country: formData.get('country') as string,
      city: formData.get('city') as string,
      address: formData.get('address') as string,
      hrEmail: formData.get('hrEmail') as string,
      phone: formData.get('phone') as string,
      hrContactName: formData.get('hrContactName') as string,
      companyCulture: formData.get('companyCulture') as string,
      benefits: formData.get('benefits') ? JSON.parse(formData.get('benefits') as string) : [],
      technologies: formData.get('technologies') ? JSON.parse(formData.get('technologies') as string) : [],
    }

    // Validate data
    const validatedData = employerProfileSchema.parse(data)

    // Update employer info in users table (single-table approach)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: validatedData.hrContactName || null,
        phone: validatedData.phone || null,
        location: `${validatedData.city || ''}, ${validatedData.country || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || null,
        company_culture: validatedData.companyCulture || null,
        hiring_preferences: null, // Can be extended later if needed
      })
      .eq('id', user.id)

    // Also create/update company record
    const { error: companyError } = await supabase
      .from('companies')
      .upsert({
        owner_id: user.id,
        name: validatedData.companyName,
        description: validatedData.companyDescription || null,
        industry: validatedData.industry || null,
        size: validatedData.companySize || null,
        website: validatedData.websiteUrl || null,
        location: `${validatedData.city || ''}, ${validatedData.country || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || null,
      }, {
        onConflict: 'owner_id'
      })

    if (updateError) {
      console.error('Error updating employer profile:', updateError)
      return { error: 'Failed to update profile' }
    }
    
    if (companyError) {
      console.error('Error updating company:', companyError)
      return { error: 'Failed to update company information' }
    }

    revalidatePath('/employer/company')
    return { success: true }

  } catch (error) {
    console.error('Error in updateEmployerProfile:', error)
    return { error: 'Invalid form data' }
  }
}

// Basic account info (first/last name) for profiles table
export async function updateBasicProfile(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const firstName = (formData.get('firstName') as string || '').trim()
    const lastName = (formData.get('lastName') as string || '').trim()

    const { error: updateError } = await supabase
      .from('users')
      .update({ full_name: `${firstName} ${lastName}`.trim() })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating basic profile:', updateError)
      return { error: 'Failed to update profile' }
    }

    revalidatePath('/job-seeker/settings')
    revalidatePath('/job-seeker/dashboard')
    return
  } catch (error) {
    console.error('Error in updateBasicProfile:', error)
    return
  }
}