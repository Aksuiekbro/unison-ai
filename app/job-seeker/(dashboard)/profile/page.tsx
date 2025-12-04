import { redirect } from 'next/navigation'
import JobSeekerProfileForm from '@/components/profile/job-seeker-profile-form'
import { createClient, getUserIdFromMiddleware } from '@/lib/supabase-server'
import { normalizeSkillsInput } from '@/lib/utils'

export default async function JobSeekerProfile() {
  // Get user ID from middleware header - no DB auth call needed!
  const { userId } = await getUserIdFromMiddleware()
  
  if (!userId) {
    redirect('/auth/login?redirectTo=/job-seeker/profile')
  }

  const supabase = await createClient()

  // Get user data with all profile fields including JSON arrays
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, full_name, email, phone, location, bio, current_job_title, linkedin_url, github_url, portfolio_url, resume_url, experiences, educations, skills')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    console.error('User data fetch failed:', userError)
    return <div className="flex-1 p-8">Error loading profile</div>
  }

  const sanitizedSkills = normalizeSkillsInput(userData.skills)

  // Transform data for the form (all from users table now)
  const nameParts = userData.full_name?.split(' ') || []
  const initialData = {
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    title: userData.current_job_title || '',
    summary: userData.bio || '',
    phone: userData.phone || '',
    location: userData.location || '',
    linkedinUrl: userData.linkedin_url || '',
    githubUrl: userData.github_url || '',
    skills: sanitizedSkills,
  }

  // Get experiences and education from JSON fields (already in correct format)
  const transformedExperiences = (userData.experiences as any[]) || []
  const transformedEducation = (userData.educations as any[]) || []

  return (
    <div className="flex-1 p-8">
      <JobSeekerProfileForm
        initialData={initialData}
        experiences={transformedExperiences}
        education={transformedEducation}
        viewerEmail={userData.email || ''}
        portfolioUrl={userData.portfolio_url || undefined}
      />
    </div>
  )
}
