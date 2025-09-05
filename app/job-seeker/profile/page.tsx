import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LayoutDashboard, User, Search, Settings, Heart } from "lucide-react"
import Link from "next/link"
import type { Database } from '@/lib/database.types'
import JobSeekerProfileForm from '@/components/profile/job-seeker-profile-form'

export default async function JobSeekerProfile() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'job_seeker') {
    redirect('/')
  }

  // Get job seeker profile data
  const { data: jsProfile } = await supabase
    .from('job_seeker_profiles')
    .select('*')
    .eq('profile_id', profile.id)
    .single()

  // Get experiences
  const { data: experiences } = await supabase
    .from('job_seeker_experiences')
    .select('*')
    .eq('job_seeker_profile_id', jsProfile?.id || '')
    .order('start_date', { ascending: false })

  // Get education
  const { data: education } = await supabase
    .from('job_seeker_education')
    .select('*')
    .eq('job_seeker_profile_id', jsProfile?.id || '')
    .order('graduation_year', { ascending: false })

  // Transform data for the form
  const initialData = jsProfile ? {
    firstName: jsProfile.first_name || '',
    lastName: jsProfile.last_name || '',
    title: jsProfile.title || '',
    summary: jsProfile.summary || '',
    phone: jsProfile.phone || '',
    location: jsProfile.location || '',
    linkedinUrl: jsProfile.linkedin_url || '',
    githubUrl: jsProfile.github_url || '',
    skills: jsProfile.skills || [],
  } : undefined

  const transformedExperiences = experiences?.map(exp => ({
    id: exp.id,
    position: exp.position,
    company: exp.company,
    startDate: exp.start_date,
    endDate: exp.end_date || undefined,
    description: exp.description || undefined,
    isCurrent: exp.is_current,
  })) || []

  const transformedEducation = education?.map(edu => ({
    id: edu.id,
    institution: edu.institution,
    degree: edu.degree,
    fieldOfStudy: edu.field_of_study,
    graduationYear: edu.graduation_year,
  })) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <Link href="/" className="text-xl font-bold text-[#0A2540]">
              Unison AI
            </Link>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/job-seeker/dashboard"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link
              href="/job-seeker/profile"
              className="flex items-center px-4 py-3 text-[#00C49A] bg-[#00C49A]/10 rounded-lg"
            >
              <User className="w-5 h-5 mr-3" />
              My Profile
            </Link>
            <Link
              href="/job-seeker/search"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Search className="w-5 h-5 mr-3" />
              Job Search
            </Link>
            <Link
              href="/job-seeker/saved"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Heart className="w-5 h-5 mr-3" />
              Saved Jobs
            </Link>
            <Link
              href="/job-seeker/settings"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <JobSeekerProfileForm
            initialData={initialData}
            experiences={transformedExperiences}
            education={transformedEducation}
          />
        </div>
      </div>
    </div>
  )
}