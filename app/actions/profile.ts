'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/database.types'
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
  const supabase = createServerActionClient<Database>({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
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

    // Update or create job seeker profile
    const { error: upsertError } = await supabase
      .from('job_seeker_profiles')
      .upsert({
        profile_id: profile.id,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        title: validatedData.title || null,
        summary: validatedData.summary || null,
        phone: validatedData.phone || null,
        location: validatedData.location || null,
        linkedin_url: validatedData.linkedinUrl || null,
        github_url: validatedData.githubUrl || null,
        skills: validatedData.skills || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id'
      })

    if (upsertError) {
      console.error('Error updating job seeker profile:', upsertError)
      return { error: 'Failed to update profile' }
    }

    revalidatePath('/job-seeker/profile')
    return { success: true }

  } catch (error) {
    console.error('Error in updateJobSeekerProfile:', error)
    return { error: 'Invalid form data' }
  }
}

export async function addJobSeekerExperience(formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Get job seeker profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'job_seeker')
      .single()

    if (profileError || !profile) {
      return { error: 'Job seeker profile not found' }
    }

    const { data: jsProfile, error: jsProfileError } = await supabase
      .from('job_seeker_profiles')
      .select('id')
      .eq('profile_id', profile.id)
      .single()

    if (jsProfileError || !jsProfile) {
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

    // Add experience
    const { error: insertError } = await supabase
      .from('job_seeker_experiences')
      .insert({
        job_seeker_profile_id: jsProfile.id,
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
  const supabase = createServerActionClient<Database>({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Get job seeker profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'job_seeker')
      .single()

    if (profileError || !profile) {
      return { error: 'Job seeker profile not found' }
    }

    const { data: jsProfile, error: jsProfileError } = await supabase
      .from('job_seeker_profiles')
      .select('id')
      .eq('profile_id', profile.id)
      .single()

    if (jsProfileError || !jsProfile) {
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

    // Add education
    const { error: insertError } = await supabase
      .from('job_seeker_education')
      .insert({
        job_seeker_profile_id: jsProfile.id,
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
  const supabase = createServerActionClient<Database>({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
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
        profile_id: profile.id,
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