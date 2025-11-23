import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import PersonalityAssessmentClient from './client'

export default async function PersonalityAssessmentPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login?redirectTo=/job-seeker/test')
  }

  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('personality_assessment_completed')
    .eq('id', user.id)
    .single()

  if (userError) {
    console.warn('Failed to load personality assessment status', userError)
  }

  if (userRecord?.personality_assessment_completed) {
    redirect('/job-seeker/results')
  }

  return <PersonalityAssessmentClient userId={user.id} />
}
