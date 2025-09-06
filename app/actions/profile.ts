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
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id as any)
      .single()

    if (profileError || !profile || profile.role !== 'job_seeker') {
      return { error: 'Job seeker profile not found' }
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

    // Update core public profiles table with main fields
    const { error: profilesUpdateError } = await supabase
      .from('profiles')
      .update({
        first_name: (validatedData.firstName as any) || null,
        last_name: (validatedData.lastName as any) || null,
        phone: validatedData.phone || null,
        location: validatedData.location || null,
        linkedin_url: validatedData.linkedinUrl || null,
        github_url: validatedData.githubUrl || null,
        skills: (validatedData.skills as any) || null,
        bio: validatedData.summary || null,
      })
      .eq('id', (profile as any).id)

    if (profilesUpdateError) {
      console.error('Error updating public profiles:', profilesUpdateError)
      return { error: `Failed to update profile: ${profilesUpdateError.message || 'Unknown error'}` }
    }

    // Note: job_seeker_profiles is deprecated; unified updates are handled via public.profiles only.

    // Keep core profile (used in greetings) in sync for first/last name
    const { error: coreUpdateError } = await supabase
      .from('profiles')
      .update({
        first_name: (validatedData.firstName as any) || null,
        last_name: (validatedData.lastName as any) || null,
      })
      .eq('id', (profile as any).id)

    if (coreUpdateError) {
      console.error('Error syncing core profile names:', coreUpdateError)
    }

    revalidatePath('/job-seeker/profile')
    revalidatePath('/job-seeker/dashboard')
    return { success: true }

  } catch (error: any) {
    console.error('Error in updateJobSeekerProfile:', error)
    return { error: `Invalid form data: ${error?.message || 'Unknown error'}` }
  }
}

export async function addJobSeekerExperience(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Verify job seeker profile exists in unified profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id as any)
      .single()

    if (profileError || !profile || (profile as any).role !== 'job_seeker') {
      return { error: 'Job seeker profile not found' }
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

    // Add experience (foreign key references profiles.id)
    const { error: insertError } = await supabase
      .from('job_seeker_experiences')
      .insert({
        job_seeker_profile_id: (profile as any).id,
        position: validatedData.position,
        company: validatedData.company,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate || null,
        description: validatedData.description || null,
        is_current: validatedData.isCurrent,
      })

    if (insertError) {
      console.error('Error adding experience:', insertError)
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
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Verify job seeker in unified profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id as any)
      .single()

    if (profileError || !profile || (profile as any).role !== 'job_seeker') {
      return { error: 'Job seeker profile not found' }
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

    // Add education (foreign key references profiles.id)
    const { error: insertError } = await supabase
      .from('job_seeker_education')
      .insert({
        job_seeker_profile_id: (profile as any).id,
        institution: validatedData.institution,
        degree: validatedData.degree,
        field_of_study: validatedData.fieldOfStudy,
        graduation_year: validatedData.graduationYear,
      })

    if (insertError) {
      console.error('Error adding education:', insertError)
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
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id as any)
      .single()

    if (profileError || !profile || profile.role !== 'employer') {
      return { error: 'Employer profile not found' }
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

    // Update or create employer profile
    const { error: upsertError } = await supabase
      .from('employer_profiles')
      .upsert({
        profile_id: (profile as any).id,
        company_name: validatedData.companyName,
        company_description: validatedData.companyDescription || null,
        industry: validatedData.industry || null,
        company_size: validatedData.companySize || null,
        founded_year: validatedData.foundedYear || null,
        website_url: validatedData.websiteUrl || null,
        country: validatedData.country || null,
        city: validatedData.city || null,
        address: validatedData.address || null,
        hr_email: validatedData.hrEmail || null,
        phone: validatedData.phone || null,
        hr_contact_name: validatedData.hrContactName || null,
        company_culture: validatedData.companyCulture || null,
        benefits: validatedData.benefits || null,
        technologies: validatedData.technologies || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id'
      })

    if (upsertError) {
      console.error('Error updating employer profile:', upsertError)
      return { error: 'Failed to update profile' }
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
  const supabase = createServerActionClient({ cookies })

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const firstName = (formData.get('firstName') as string || '').trim()
    const lastName = (formData.get('lastName') as string || '').trim()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ first_name: (firstName as any) || null, last_name: (lastName as any) || null })
      .eq('id', user.id as any)

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