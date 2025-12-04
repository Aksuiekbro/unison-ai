import type { Database } from "@/lib/database.types"
import { redirect } from 'next/navigation'
import EmployerJobsClient from "./client"
import { getUser } from '@/lib/supabase-server'

export default async function EmployerJobs() {
  // Use cached auth helper - middleware handles authentication
  const user = await getUser()
  
  if (!user) {
    console.error('No user found - middleware should have redirected')
    redirect(`/auth/login?redirectTo=/employer/jobs`)
  }

  return (
    <div className="flex-1 p-8">
      <EmployerJobsClient userId={user.id} />
    </div>
  )
}
