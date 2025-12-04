import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Plus, Users, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"
import { createClient, getUser } from '@/lib/supabase-server'
import { EmployerDashboardService, type DashboardData } from '@/lib/services/employer-dashboard'
import { createServerTranslator } from '@/lib/i18n/server'
import type { Locale } from '@/lib/i18n/config'
import { getIntlLocale } from '@/lib/i18n/utils'

export default async function EmployerDashboard() {
  // Use cached getUser - no duplicate auth calls
  const { user, error: authError } = await getUser()
  const { t, locale } = await createServerTranslator()
  
  if (authError || !user) {
    return <div className="flex-1 p-8">{t('employer.common.authRequired')}</div>
  }

  const supabase = await createClient()

  // Fetch dashboard data
  let dashboardData: DashboardData | null = null
  let error: string | null = null

  try {
    const employerDashboardService = new EmployerDashboardService(supabase)
    dashboardData = await employerDashboardService.getDashboardData(user.id)
  } catch (e) {
    error = t('employer.dashboard.errorDescription')
    console.error('Dashboard data fetch error:', e)
  }

  return <EmployerDashboardContent dashboardData={dashboardData} error={error} t={t} locale={locale} />
}

function EmployerDashboardContent({
  dashboardData,
  error,
  t,
  locale,
}: {
  dashboardData: DashboardData | null
  error: string | null
  t: (key: string, values?: Record<string, string | number>) => string
  locale: Locale
}) {
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">{t('common.status.error')}</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            {t('common.actions.retry')}
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto"></div>
          <p className="text-gray-600 mt-4">{t('employer.dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  const { stats, activeJobs } = dashboardData
  const intlLocale = getIntlLocale(locale)
  const dateFormatter = new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'long' })

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540]">{t('employer.dashboard.title')}</h1>
            <p className="text-[#333333] mt-1">{t('employer.dashboard.subtitle')}</p>
          </div>
          <Button className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
            <Plus className="w-4 h-4 mr-2" />
            {t('employer.dashboard.createJob')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#333333]">{t('employer.dashboard.stats.activeJobs')}</p>
                  <p className="text-2xl font-bold text-[#0A2540]">{stats.activeJobs}</p>
                </div>
                <Briefcase className="w-8 h-8 text-[#FF7A00]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#333333]">{t('employer.dashboard.stats.newCandidates')}</p>
                  <p className="text-2xl font-bold text-[#00C49A]">{stats.newCandidates}</p>
                </div>
                <Users className="w-8 h-8 text-[#00C49A]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#333333]">{t('employer.dashboard.stats.weeklyInterviews')}</p>
                  <p className="text-2xl font-bold text-[#0A2540]">{stats.weeklyInterviews}</p>
                </div>
                <Calendar className="w-8 h-8 text-[#0A2540]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#333333]">{t('employer.dashboard.stats.averageMatchScore')}</p>
                  <p className="text-2xl font-bold text-[#FF7A00]">{stats.averageMatchScore}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#FF7A00]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A2540]">{t('employer.dashboard.jobs.title')}</CardTitle>
            <CardDescription>{t('employer.dashboard.jobs.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('employer.dashboard.jobs.emptyTitle')}</h3>
                  <p className="text-gray-500 mb-4">{t('employer.dashboard.jobs.emptyDescription')}</p>
                  <Link href="/employer/jobs/create">
                    <Button className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('employer.dashboard.jobs.emptyCta')}
                    </Button>
                  </Link>
                </div>
              ) : (
                activeJobs.map((job) => {
                  const formattedDate = job.postedAt ? dateFormatter.format(new Date(job.postedAt)) : ''
                  const jobStatusKey =
                    job.status === 'published'
                      ? 'employer.jobStatus.published'
                      : 'employer.jobStatus.paused'

                  return (
                    <div key={job.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#0A2540]">{job.title}</h3>
                            <Badge
                              variant={job.status === 'published' ? 'default' : 'secondary'}
                              className={job.status === 'published' ? 'bg-[#00C49A] text-white' : ''}
                            >
                              {t(jobStatusKey)}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#333333] mb-3">
                            {t('employer.dashboard.jobs.publishedOn', { date: formattedDate })}
                          </p>
                          <div className="flex items-center space-x-6 text-sm">
                            <span className="text-[#333333]">
                              {t('employer.dashboard.jobs.totalCandidates')}:{' '}
                              <span className="font-semibold">{job.totalCandidates}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="bg-[#FF7A00] text-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
                            <span className="text-xl font-bold">+{job.newCandidates}</span>
                          </div>
                          <p className="text-xs text-[#333333]">{t('employer.dashboard.jobs.newCandidates')}</p>
                        </div>

                        <div className="ml-6">
                          <Link href={`/employer/jobs/${job.id}/candidates`}>
                            <Button className="bg-[#00C49A] hover:bg-[#00A085] text-white">
                              {t('employer.dashboard.jobs.viewCandidates')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}