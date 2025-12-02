import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-server'
import { getJobById } from '@/lib/actions/jobs'
import { EditJobForm } from './edit-job-form'

type ParamsPromise = { params: Promise<{ id: string }> }

export default async function EmployerJobEditPage(context: ParamsPromise) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/auth/login?redirectTo=/employer/jobs/${id}/edit`)
  }

  const jobResult = await getJobById(id, user.id)

  if (!jobResult.success || !jobResult.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Job not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{jobResult.error || 'The requested job could not be loaded.'}</p>
            <Link href="/employer/jobs">
              <Button variant="outline">Back to jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const job = jobResult.data

  return <EditJobForm job={job} employerId={user.id} />
}
