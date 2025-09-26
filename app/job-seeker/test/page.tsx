import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ProductivityAssessmentClient from './client'
import { checkProductivityAssessmentStatus } from '@/actions/productivity-assessment'

export default async function ProductivityAssessmentPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login?redirectTo=/job-seeker/test')
  }

  // Check if user has already completed the assessment
  const assessmentStatus = await checkProductivityAssessmentStatus()
  if (assessmentStatus.completed) {
    redirect('/job-seeker/results')
  }

  return <ProductivityAssessmentClient />
}