import { createClient } from '@/lib/supabase-server'
import { LayoutDashboard, Briefcase, Building2 } from "lucide-react"
import Link from "next/link"
import type { Database } from '@/lib/types/database'
import EmployerProfileForm from '@/components/profile/employer-profile-form'
import { redirect } from 'next/navigation'

export default async function CompanyProfile() {
  const supabase = await createClient()
  
  // Middleware handles authentication - just get user data
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // This shouldn't happen due to middleware, but handle gracefully
    console.error('No user found - middleware should have redirected')
    redirect('/auth/login?redirectTo=/employer/company')
  }

  // Get user data (single-table approach)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    console.error('User data fetch failed:', userError)
    return <div>Error loading profile</div>
  }

  // Get company data
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle() // Use maybeSingle since company might not exist yet

  // Transform data for the form (combining user data and company data)
  const initialData = {
    companyName: companyData?.name || '',
    companyDescription: companyData?.description || '',
    industry: companyData?.industry || '',
    companySize: companyData?.size || '',
    foundedYear: undefined, // Not in current schema
    websiteUrl: companyData?.website || '',
    country: '', // Extract from location if needed
    city: '', // Extract from location if needed  
    address: companyData?.location || '',
    hrEmail: userData.email || '',
    phone: userData.phone || '',
    hrContactName: userData.full_name || '',
    companyCulture: userData.company_culture || '',
    benefits: [], // Not in current schema
    technologies: [], // Not in current schema
  }

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
              {companyData?.name || 'Company'}
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