import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, User, Search, Settings, Eye, Calendar, MapPin, Clock, Heart } from "lucide-react"
import Link from "next/link"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from "@/lib/types/database"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { createServerTranslator } from "@/lib/i18n/server"
import { getIntlLocale } from "@/lib/i18n/utils"

export default async function JobSeekerDashboard() {
  const supabase = await createClient()
  const { t, locale } = await createServerTranslator()
  const intlLocale = getIntlLocale(locale)
  const dateFormatter = new Intl.DateTimeFormat(intlLocale)
  let user: SupabaseUser | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user in job-seeker dashboard', error)
      redirect('/auth/login?error=auth_error&redirectTo=/job-seeker/dashboard')
    }
    user = data?.user ?? null
  } catch (err) {
    console.error('Unexpected error calling auth.getUser in job-seeker dashboard', err)
    redirect('/auth/login?error=auth_exception&redirectTo=/job-seeker/dashboard')
  }
  if (!user) {
    redirect('/auth/login?redirectTo=/job-seeker/dashboard')
  }

  let displayName = ""
  let applications: {
    id: string
    company: string
    position: string
    status: string
    rawStatus: string
    date: string
  }[] = []
  let recommendations: { id: string; company: string; position: string; location: string; salary: string }[] = []
  let profileProgress = 0

  const statusLabels: Record<string, string> = {
    pending: t('jobSeeker.applicationStatus.pending'),
    reviewing: t('jobSeeker.applicationStatus.reviewing'),
    interview: t('jobSeeker.applicationStatus.interview'),
    accepted: t('jobSeeker.applicationStatus.accepted'),
    rejected: t('jobSeeker.applicationStatus.rejected'),
  }

  function mapStatus(status: string) {
    return statusLabels[status] || status
  }

  function formatDate(iso?: string | null) {
    if (!iso) return t('common.data.none')
    try {
      return dateFormatter.format(new Date(iso))
    } catch {
      return t('common.data.none')
    }
  }

  function formatSalary(min?: number | null, max?: number | null, currency?: string | null) {
    if (!min && !max) return t('common.data.none')
    const cur = currency || '₸'
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${cur}`
    return `${(min || max || 0).toLocaleString()} ${cur}`
  }

  type JobListItem = {
    id: string
    title: string
    location: string | null
    salary_min: number | null
    salary_max: number | null
    currency: string | null
    company?: { name?: string | null }[] | null
  }

  if (user) {
    // Run all dashboard reads in parallel to cut perceived latency
    const profilePromise = supabase
      .from('users')
      .select('full_name,email,current_job_title,bio,skills,experiences,educations,location,linkedin_url,github_url,portfolio_url,resume_url')
      .eq('id', user.id)
      .maybeSingle()

    const appsPromise = supabase
      .from('applications')
      .select(`
        id,
        status,
        applied_at,
        job:jobs (
          title,
          company:companies (
            name
          )
        )
      `)
      .eq('applicant_id', user.id)
      .order('applied_at', { ascending: false })
      .limit(5)

    const jobsPromise = supabase
      .from('jobs')
      .select(`
        id,
        title,
        location,
        salary_min,
        salary_max,
        currency,
        company:companies (
          name
        )
      `)
      .eq('status', 'published')
      .order('posted_at', { ascending: false })
      .limit(3)

    const [profileResult, appsResult, jobsResult] = await Promise.all([profilePromise, appsPromise, jobsPromise])

    const userData = profileResult.data
    if (profileResult.error || !userData) {
      if (profileResult.error) {
        console.error('Error fetching user data for dashboard', profileResult.error)
      }
      displayName = user.email ? user.email.split('@')[0] : ''
    } else {
      displayName = userData.full_name || (userData.email ? userData.email.split('@')[0] : '')
    }

    const apps = appsResult.data
    if (appsResult.error) {
      console.error('Error fetching applications for dashboard', appsResult.error)
    }
    applications = (apps ?? []).map((a) => ({
      id: a.id,
      company: a.job?.[0]?.company?.[0]?.name ?? '—',
      position: a.job?.[0]?.title ?? '—',
      status: mapStatus(a.status),
      rawStatus: a.status,
      date: formatDate(a.applied_at),
    }))

    const jobs = jobsResult.data
    if (jobsResult.error) {
      console.error('Error fetching jobs for dashboard', jobsResult.error)
    }
    recommendations = (Array.isArray(jobs) ? jobs : []).map((j: JobListItem) => ({
      id: j.id,
      company: j.company?.[0]?.name || '—',
      position: j.title,
      location: j.location || '—',
      salary: formatSalary(j.salary_min, j.salary_max, j.currency),
    }))

    const profile = profileResult.data
    if (profile) {
      const items: boolean[] = [
        !!profile.full_name && !!profile.current_job_title,
        !!profile.bio,
        Array.isArray(profile.skills) && profile.skills.length > 0,
        Array.isArray(profile.experiences) && (profile.experiences as any[]).length > 0,
        Array.isArray(profile.educations) && (profile.educations as any[]).length > 0,
        !!profile.location,
        !!(profile.linkedin_url || profile.github_url || profile.portfolio_url),
        !!profile.resume_url,
      ]
      const filled = items.filter(Boolean).length
      profileProgress = Math.round((filled / items.length) * 100)
    }
  }

  return (
    <JobSeekerDashboardContent
      displayName={displayName}
      applications={applications}
      recommendations={recommendations}
      profileProgress={profileProgress}
      t={t}
    />
  )
}

function JobSeekerDashboardContent({
  displayName,
  applications,
  recommendations,
  profileProgress,
  t,
}: {
  displayName: string
  applications: { id: string; company: string; position: string; status: string; rawStatus: string; date: string }[]
  recommendations: { id: string; company: string; position: string; location: string; salary: string }[]
  profileProgress: number
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
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
              className="flex items-center px-4 py-3 text-[#00C49A] bg-[#00C49A]/10 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              {t('dashboardNav.dashboard')}
            </Link>
            <Link
              href="/job-seeker/profile"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <User className="w-5 h-5 mr-3" />
              {t('dashboardNav.profile')}
            </Link>
            <Link
              href="/job-seeker/search"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Search className="w-5 h-5 mr-3" />
              {t('dashboardNav.browseJobs')}
            </Link>
            <Link
              href="/job-seeker/saved"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Heart className="w-5 h-5 mr-3" />
              {t('dashboardNav.savedJobs')}
            </Link>
            <Link
              href="/job-seeker/settings"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5 mr-3" />
              {t('dashboardNav.settings')}
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-[#0A2540] mb-8">
              {displayName
                ? t('jobSeeker.dashboard.welcomeNamed', { name: displayName })
                : t('jobSeeker.dashboard.welcome')}
            </h1>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Application Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540]">
                      {t('jobSeeker.dashboard.applicationStatus.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('jobSeeker.dashboard.applicationStatus.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#0A2540]">{app.position}</h4>
                            <p className="text-sm text-[#333333]">{app.company}</p>
                            <p className="text-xs text-gray-500 mt-1">{app.date}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant={app.rawStatus === "interview" ? "default" : "secondary"}
                              className={app.rawStatus === "interview" ? "bg-[#00C49A] text-white" : ""}
                            >
                              {app.status}
                            </Badge>
                            {app.rawStatus === "interview" && (
                              <Button size="sm" className="bg-[#FF7A00] hover:bg-[#E66A00]">
                                <Calendar className="w-4 h-4 mr-1" />
                                {t('jobSeeker.dashboard.applicationStatus.interviewCta')}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540]">{t('jobSeeker.dashboard.profileProgress.title')}</CardTitle>
                    <CardDescription>{t('jobSeeker.dashboard.profileProgress.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-[#00C49A]">{profileProgress}%</span>
                        <Link href="/job-seeker/profile">
                          <Button variant="outline" size="sm">
                            {t('jobSeeker.dashboard.profileProgress.cta')}
                          </Button>
                        </Link>
                      </div>
                      <Progress value={profileProgress} className="h-3" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                          {t('jobSeeker.dashboard.profileProgress.items.personalData')}
                        </div>
                        <div className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                          {t('jobSeeker.dashboard.profileProgress.items.workExperience')}
                        </div>
                        <div className="flex items-center text-orange-500">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          {t('jobSeeker.dashboard.profileProgress.items.skills')}
                        </div>
                        <div className="flex items-center text-gray-400">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          {t('jobSeeker.dashboard.profileProgress.items.assessments')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Recommended Jobs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540]">{t('jobSeeker.dashboard.recommendations.title')}</CardTitle>
                    <CardDescription>{t('jobSeeker.dashboard.recommendations.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recommendations.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-1">{t('jobSeeker.dashboard.recommendations.emptyTitle')}</p>
                        <p className="text-gray-500 mb-3">{t('jobSeeker.dashboard.recommendations.emptyDescription')}</p>
                        <Link href="/job-seeker/search">
                          <Button variant="outline">{t('jobSeeker.dashboard.recommendations.cta')}</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recommendations.map((job) => (
                          <div key={job.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <h4 className="font-semibold text-[#0A2540] mb-2">{job.position}</h4>
                            <p className="text-sm text-[#333333] mb-2">{job.company}</p>
                            <div className="flex items-center text-xs text-gray-500 space-x-3 mb-3">
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {job.location}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {job.salary}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full border-[#00C49A] text-[#00C49A] hover:bg-[#00C49A] hover:text-white bg-transparent"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {t('jobSeeker.dashboard.recommendations.viewDetails')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
