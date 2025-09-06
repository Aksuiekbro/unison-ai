import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, User, Search, Settings, Eye, Calendar, MapPin, Clock, Heart } from "lucide-react"
import Link from "next/link"
import { RoleGuard } from "@/components/role-guard"
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
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name,last_name,email')
      .eq('id', user.id as any)
      .maybeSingle()
    const first = (profile as any)?.first_name as string | undefined
    const last = (profile as any)?.last_name as string | undefined
    const email = (profile as any)?.email as string | undefined
    displayName = [first, last].filter(Boolean).join(' ').trim() || (email ? email.split('@')[0] : '')
  }

  return (
    <RoleGuard allowedRoles={['employee', 'job-seeker']}>
      <JobSeekerDashboardContent displayName={displayName} />
    </RoleGuard>
  )
}

function JobSeekerDashboardContent({ displayName }: { displayName: string }) {
  const applications = [
    { id: 1, company: "TechCorp", position: "Frontend Developer", status: "В просмотре", date: "2 дня назад" },
    {
      id: 2,
      company: "StartupXYZ",
      position: "React Developer",
      status: "Приглашение на интервью",
      date: "1 день назад",
    },
    { id: 3, company: "BigTech", position: "Senior Developer", status: "В просмотре", date: "5 дней назад" },
  ]

  const recommendations = [
    { id: 1, company: "InnovateLab", position: "Full Stack Developer", location: "Москва", salary: "150-200k" },
    { id: 2, company: "DevStudio", position: "React Native Developer", location: "СПб", salary: "120-180k" },
    { id: 3, company: "TechFlow", position: "Frontend Lead", location: "Удаленно", salary: "200-250k" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
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
                        <span className="text-2xl font-bold text-[#00C49A]">75%</span>
                        <Link href="/job-seeker/profile">
                          <Button variant="outline" size="sm">
                            Завершить профиль
                          </Button>
                        </Link>
                      </div>
                      <Progress value={75} className="h-3" />
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