import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, User, Search, Settings, Eye, Calendar, MapPin, Clock, Heart } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

export default async function JobSeekerDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = ""
  let applications: { id: string; company: string; position: string; status: string; date: string }[] = []
  let recommendations: { id: string; company: string; position: string; location: string; salary: string }[] = []
  let profileProgress = 0

  function mapStatusToRu(status: string) {
    switch (status) {
      case 'pending': return 'Отправлено'
      case 'reviewing': return 'В просмотре'
      case 'interview': return 'Приглашение на интервью'
      case 'accepted': return 'Принято'
      case 'rejected': return 'Отклонено'
      default: return status
    }
  }

  function formatDateRu(iso?: string | null) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('ru-RU')
    } catch { return '—' }
  }

  function formatSalary(min?: number | null, max?: number | null, currency?: string | null) {
    if (!min && !max) return '—'
    const cur = currency || '₸'
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${cur}`
    return `${(min || max || 0).toLocaleString()} ${cur}`
  }

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('full_name,email')
      .eq('id', user.id)
      .single()
    displayName = userData?.full_name || (userData?.email ? userData.email.split('@')[0] : '')

    // Applications (latest 5)
    const { data: apps } = await supabase
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

    applications = (apps as any[] | null || []).map((a: any) => ({
      id: a.id,
      company: a.job?.company?.name || '—',
      position: a.job?.title || '—',
      status: mapStatusToRu(a.status),
      date: formatDateRu(a.applied_at),
    }))

    // Recommended jobs (latest published 3)
    const { data: jobs } = await supabase
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

    recommendations = (jobs as any[] | null || []).map((j: any) => ({
      id: j.id,
      company: j.company?.name || '—',
      position: j.title,
      location: j.location || '—',
      salary: formatSalary(j.salary_min, j.salary_max, j.currency),
    }))

    // Profile progress (simple heuristic)
    const { data: profile } = await supabase
      .from('users')
      .select('full_name,current_job_title,bio,skills,experiences,educations,location,linkedin_url,github_url,portfolio_url,resume_url')
      .eq('id', user.id)
      .single()

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

  return <JobSeekerDashboardContent displayName={displayName} applications={applications} recommendations={recommendations} profileProgress={profileProgress} />
}

function JobSeekerDashboardContent({ displayName, applications, recommendations, profileProgress }: { displayName: string, applications: { id: string; company: string; position: string; status: string; date: string }[], recommendations: { id: string; company: string; position: string; location: string; salary: string }[], profileProgress: number }) {
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
              Дашборд
            </Link>
            <Link
              href="/job-seeker/profile"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <User className="w-5 h-5 mr-3" />
              Мой профиль
            </Link>
            <Link
              href="/job-seeker/search"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Search className="w-5 h-5 mr-3" />
              Поиск вакансий
            </Link>
            <Link
              href="/job-seeker/saved"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Heart className="w-5 h-5 mr-3" />
              Избранное
            </Link>
            <Link
              href="/job-seeker/settings"
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
            <h1 className="text-3xl font-bold text-[#0A2540] mb-8">Добро пожаловать{displayName ? `, ${displayName}` : ''}!</h1>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Application Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540]">Статус моих откликов</CardTitle>
                    <CardDescription>Отслеживайте прогресс ваших заявок</CardDescription>
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
                              variant={app.status === "Приглашение на интервью" ? "default" : "secondary"}
                              className={app.status === "Приглашение на интервью" ? "bg-[#00C49A] text-white" : ""}
                            >
                              {app.status}
                            </Badge>
                            {app.status === "Приглашение на интервью" && (
                              <Button size="sm" className="bg-[#FF7A00] hover:bg-[#E66A00]">
                                <Calendar className="w-4 h-4 mr-1" />
                                Ответить
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
                    <CardTitle className="text-[#0A2540]">Прогресс заполнения профиля</CardTitle>
                    <CardDescription>Завершите профиль для лучших результатов</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-[#00C49A]">{profileProgress}%</span>
                        <Link href="/job-seeker/profile">
                          <Button variant="outline" size="sm">
                            Завершить профиль
                          </Button>
                        </Link>
                      </div>
                      <Progress value={profileProgress} className="h-3" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                          Личные данные
                        </div>
                        <div className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                          Опыт работы
                        </div>
                        <div className="flex items-center text-orange-500">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          Навыки
                        </div>
                        <div className="flex items-center text-gray-400">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          Тестирование
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
                    <CardTitle className="text-[#0A2540]">Рекомендованные вакансии</CardTitle>
                    <CardDescription>Подобраны специально для вас</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                            Подробнее
                          </Button>
                        </div>
                      ))}
                    </div>
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