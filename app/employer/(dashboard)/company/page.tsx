import type { Database } from '@/lib/database.types'
import EmployerProfileForm from '@/components/profile/employer-profile-form'
import { redirect } from 'next/navigation'
import { getUser, createClient } from '@/lib/supabase-server'

export default async function CompanyProfile() {
  // Use cached auth helper
  const user = await getUser()
  
  if (!user) {
    // This shouldn't happen due to middleware, but handle gracefully
    console.error('No user found - middleware should have redirected')
    redirect('/auth/login?redirectTo=/employer/company')
  }

  const supabase = await createClient()

  // Get user data (single-table approach)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    console.error('User data fetch failed:', userError)
    return <div>Ошибка загрузки профиля</div>
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
    companyCulture: companyData?.company_culture || '',
    benefits: companyData?.benefits || [],
    technologies: companyData?.technologies || [],
  }

  return (
    <div className="flex-1 p-8">
      <EmployerProfileForm initialData={initialData} />
    </div>
  )
}
