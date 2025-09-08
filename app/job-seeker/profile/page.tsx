import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LayoutDashboard, User, Search, Settings, Heart } from "lucide-react"
import Link from "next/link"
import type { Database } from '@/lib/database.types'
import JobSeekerProfileForm from '@/components/profile/job-seeker-profile-form'

export default async function JobSeekerProfile() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      redirect('/auth/login')
    }

    // Get user data from users table  
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, full_name, email, phone, location, bio')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'job_seeker') {
      console.error('User role check failed:', userError)
      redirect('/')
    }

    // Get user profile - this might not exist, so provide fallback
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Create empty profile if none exists
    const safeProfile = profile || {}

    // Get experiences - use safe fallback
    const { data: experiences } = await supabase
      .from('experiences')
      .select('*')
      .eq('profile_id', safeProfile.id || 'nonexistent')
      .order('start_date', { ascending: false })

    // Get education - use safe fallback
    const { data: education } = await supabase
      .from('educations')
      .select('*')
      .eq('profile_id', safeProfile.id || 'nonexistent')
      .order('start_date', { ascending: false })

    // Transform data for the form
    const nameParts = userData.full_name?.split(' ') || []
    const initialData = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      title: (safeProfile as any)?.current_job_title || '',
      summary: userData.bio || '',
      phone: userData.phone || '',
      location: userData.location || (safeProfile as any)?.preferred_location || '',
      linkedinUrl: (safeProfile as any)?.linkedin_url || '',
      githubUrl: (safeProfile as any)?.github_url || '',
      skills: (safeProfile as any)?.skills || [],
    }

    const transformedExperiences = experiences?.map(exp => ({
      id: exp.id,
      position: exp.job_title,
      company: exp.company_name,
      startDate: exp.start_date,
      endDate: exp.end_date || undefined,
      description: exp.description || undefined,
      isCurrent: exp.is_current,
    })) || []

    const transformedEducation = education?.map(edu => ({
      id: edu.id,
      institution: edu.institution_name,
      degree: edu.degree,
      fieldOfStudy: edu.field_of_study,
      graduationYear: edu.end_date ? new Date(edu.end_date).getFullYear() : new Date().getFullYear(),
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
                Дашборд
              </Link>
              <Link
                href="/job-seeker/profile"
                className="flex items-center px-4 py-3 text-[#00C49A] bg-[#00C49A]/10 rounded-lg"
              >
                <User className="w-5 h-5 mr-3" />
                Мой профиль
              </Link>
              <Link
                href="/job-seeker/search"
                className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
              >
                <Search className="w-5 h-5 mr-3" />
                Поиск вакансий
              </Link>
              <Link
                href="/job-seeker/saved"
                className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
              >
                <Heart className="w-5 h-5 mr-3" />
                Избранное
              </Link>
              <Link
                href="/job-seeker/settings"
                className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5 mr-3" />
                Настройки
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <JobSeekerProfileForm
              initialData={initialData}
              experiences={transformedExperiences}
              education={transformedEducation}
              viewerEmail={userData.email || user.email || ''}
            />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Profile page error:', error)
    // Fallback UI in case of errors
    redirect('/job-seeker/dashboard')
  }
}