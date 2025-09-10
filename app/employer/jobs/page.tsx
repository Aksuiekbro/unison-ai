import { cookies } from "next/headers"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from "@/lib/database.types"
import { redirect } from 'next/navigation'
import EmployerJobsClient from "./client"

export default async function EmployerJobs() {
  // Middleware handles authentication - just get user data
  const cookieStore = await cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('No user found - middleware should have redirected')
    redirect(`/auth/login?redirectTo=/employer/jobs`)
  }

  return <EmployerJobsClient userId={user.id} />
}
