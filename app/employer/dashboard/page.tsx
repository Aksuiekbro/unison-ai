import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Briefcase, Building2, Plus, Users, Calendar, TrendingUp, Settings } from "lucide-react"
import Link from "next/link"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { EmployerDashboardService, type DashboardData } from '@/lib/services/employer-dashboard'
import type { Database } from '@/lib/database.types'

export default async function EmployerDashboard() {
  // Middleware handles all authentication and role-based access
  // This component assumes user is authenticated and authorized
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Authentication required</div>
  }

  // Fetch dashboard data
  let dashboardData: DashboardData | null = null
  let error: string | null = null

  try {
    const employerDashboardService = new EmployerDashboardService(supabase)
    dashboardData = await employerDashboardService.getDashboardData(user.id)
  } catch (e) {
    error = 'Failed to load dashboard data'
    console.error('Dashboard data fetch error:', e)
  }

  return <EmployerDashboardContent dashboardData={dashboardData} error={error} />
}

function EmployerDashboardContent({ 
  dashboardData, 
  error 
}: { 
  dashboardData: DashboardData | null
  error: string | null 
}) {
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const { stats, activeJobs } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <Link href="/" className="text-xl font-bold text-[#0A2540]">
              Unison AI
            </Link>
            <p className="text-sm text-[#333333] mt-1">TechCorp Inc.</p>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/employer/dashboard"
              className="flex items-center px-4 py-3 text-[#FF7A00] bg-[#FF7A00]/10 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Дашборд
            </Link>
            <Link
              href="/employer/jobs"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Briefcase className="w-5 h-5 mr-3" />
              Вакансии
            </Link>
            <Link
              href="/employer/company"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Building2 className="w-5 h-5 mr-3" />
              Профиль компании
            </Link>
            <Link
              href="/employer/settings"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5 mr-3" />
              Настройки
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#0A2540]">Дашборд работодателя</h1>
                <p className="text-[#333333] mt-1">Управляйте вакансиями и кандидатами</p>
              </div>
              <Button className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Создать вакансию
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#333333]">Активные вакансии</p>
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
                      <p className="text-sm text-[#333333]">Новые кандидаты</p>
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
                      <p className="text-sm text-[#333333]">Интервью на неделе</p>
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
                      <p className="text-sm text-[#333333]">Средний Match Score</p>
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
                <CardTitle className="text-[#0A2540]">Активные вакансии</CardTitle>
                <CardDescription>Управляйте вашими открытыми позициями</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Нет активных вакансий</h3>
                      <p className="text-gray-500 mb-4">Создайте свою первую вакансию, чтобы начать поиск кандидатов</p>
                      <Link href="/employer/jobs/create">
                        <Button className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          Создать вакансию
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    activeJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-[#0A2540]">{job.title}</h3>
                              <Badge
                                variant={job.status === "published" ? "default" : "secondary"}
                                className={job.status === "published" ? "bg-[#00C49A] text-white" : ""}
                              >
                                {job.status === "published" ? "Активна" : "На паузе"}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#333333] mb-3">Опубликовано {job.postedAt}</p>
                            <div className="flex items-center space-x-6 text-sm">
                              <span className="text-[#333333]">
                                Всего кандидатов: <span className="font-semibold">{job.totalCandidates}</span>
                              </span>
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="bg-[#FF7A00] text-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
                              <span className="text-xl font-bold">+{job.newCandidates}</span>
                            </div>
                            <p className="text-xs text-[#333333]">новых кандидатов</p>
                          </div>

                          <div className="ml-6">
                            <Link href={`/employer/jobs/${job.id}/candidates`}>
                              <Button className="bg-[#00C49A] hover:bg-[#00A085] text-white">
                                Просмотреть кандидатов
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}