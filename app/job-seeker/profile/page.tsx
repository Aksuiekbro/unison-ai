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
    // Middleware handles authentication - just get user data
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // This shouldn't happen due to middleware, but handle gracefully
      console.error('No user found - middleware should have redirected')
      redirect('/auth/login?redirectTo=/job-seeker/profile')
    }

    // Get user data with all profile fields including JSON arrays
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, full_name, email, phone, location, bio, current_job_title, linkedin_url, github_url, portfolio_url, resume_url, experiences, educations, skills')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('User data fetch failed:', userError)
      return <div>Error loading profile</div>
    }

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
      skills: (userData.skills as string[]) || [], // Load skills from database
    }

    // Get experiences and education from JSON fields (already in correct format)
    const transformedExperiences = (userData.experiences as any[]) || []
    const transformedEducation = (userData.educations as any[]) || []

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
              portfolioUrl={userData.portfolio_url || undefined}
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