import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Briefcase, Building2, Plus, Users, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"
import { RoleGuard } from "@/components/role-guard"

export default function EmployerDashboard() {
  return (
    <RoleGuard allowedRoles={['employer']}>
      <EmployerDashboardContent />
    </RoleGuard>
  )
}

function EmployerDashboardContent() {
  const activeJobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      posted: "3 дня назад",
      newCandidates: 12,
      totalCandidates: 45,
      status: "Активна",
    },
    {
      id: 2,
      title: "React Native Developer",
      posted: "1 неделю назад",
      newCandidates: 8,
      totalCandidates: 32,
      status: "Активна",
    },
    {
      id: 3,
      title: "DevOps Engineer",
      posted: "5 дней назад",
      newCandidates: 15,
      totalCandidates: 28,
      status: "Активна",
    },
    {
      id: 4,
      title: "UI/UX Designer",
      posted: "2 недели назад",
      newCandidates: 3,
      totalCandidates: 67,
      status: "На паузе",
    },
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
                      <p className="text-2xl font-bold text-[#0A2540]">4</p>
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
                      <p className="text-2xl font-bold text-[#00C49A]">38</p>
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
                      <p className="text-2xl font-bold text-[#0A2540]">12</p>
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
                      <p className="text-2xl font-bold text-[#FF7A00]">76%</p>
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
                  {activeJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#0A2540]">{job.title}</h3>
                            <Badge
                              variant={job.status === "Активна" ? "default" : "secondary"}
                              className={job.status === "Активна" ? "bg-[#00C49A] text-white" : ""}
                            >
                              {job.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#333333] mb-3">Опубликовано {job.posted}</p>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}