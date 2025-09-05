import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Briefcase, Building2 } from "lucide-react"
import Link from "next/link"
import type { Database } from '@/lib/database.types'
import EmployerProfileForm from '@/components/profile/employer-profile-form'

export default async function CompanyProfile() {
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

  if (profileError || !profile || profile.role !== 'employer') {
    redirect('/')
  }

  // Get employer profile data
  const { data: empProfile } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('profile_id', profile.id)
    .single()

  // Transform data for the form
  const initialData = empProfile ? {
    companyName: empProfile.company_name,
    companyDescription: empProfile.company_description || '',
    industry: empProfile.industry || '',
    companySize: empProfile.company_size || '',
    foundedYear: empProfile.founded_year || undefined,
    websiteUrl: empProfile.website_url || '',
    country: empProfile.country || '',
    city: empProfile.city || '',
    address: empProfile.address || '',
    hrEmail: empProfile.hr_email || '',
    phone: empProfile.phone || '',
    hrContactName: empProfile.hr_contact_name || '',
    companyCulture: empProfile.company_culture || '',
    benefits: empProfile.benefits || [],
    technologies: empProfile.technologies || [],
  } : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <Link href="/" className="text-xl font-bold text-[#0A2540]">
              Unison AI
            </Link>
            <p className="text-sm text-[#333333] mt-1">
              {empProfile?.company_name || 'Company'}
            </p>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/employer/dashboard"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link
              href="/employer/jobs"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Briefcase className="w-5 h-5 mr-3" />
              Jobs
            </Link>
            <Link
              href="/employer/company"
              className="flex items-center px-4 py-3 text-[#FF7A00] bg-[#FF7A00]/10 rounded-lg"
            >
              <Building2 className="w-5 h-5 mr-3" />
              Company Profile
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <EmployerProfileForm initialData={initialData} />
        </div>
      </div>
    </div>
  )
}