import type { Database } from "@/lib/database.types"
import { redirect } from 'next/navigation'
import EmployerJobsClient from "./client"
import { createClient } from '@/lib/supabase-server'

export default async function EmployerJobs() {
  // Middleware handles authentication - just get user data
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('No user found - middleware should have redirected')
    redirect(`/auth/login?redirectTo=/employer/jobs`)
  }

  return <EmployerJobsClient userId={user.id} />
}
