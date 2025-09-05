import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, User, Search, Settings, Heart, MapPin, Clock, Building2, Trash2 } from "lucide-react"
import Link from "next/link"

export default function SavedJobs() {
  const savedJobs = [
    {
      id: 1,
      title: "Senior React Developer",
      company: "TechCorp",
      location: "Москва",
      salary: "200-300k",
      type: "Полная занятость",
      remote: true,
      posted: "2 дня назад",
      matchScore: 95,
      saved: "3 дня назад",
      skills: ["React", "TypeScript", "GraphQL"],
    },
    {
      id: 2,
      title: "Frontend Team Lead",
      company: "StartupXYZ",
      location: "СПб",
      salary: "250-350k",
      type: "Полная занятость",
      remote: false,
      posted: "1 день назад",
      matchScore: 88,
      saved: "1 день назад",
      skills: ["React", "Vue.js", "Leadership"],
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
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/job-seeker/dashboard"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
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
              className="flex items-center px-4 py-3 text-[#00C49A] bg-[#00C49A]/10 rounded-lg"
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-[#0A2540] mb-8">Избранные вакансии</h1>

            {savedJobs.length > 0 ? (
              <div className="space-y-4">
                {savedJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-semibold text-[#0A2540] mb-1">{job.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-[#333333]">
                                <div className="flex items-center">
                                  <Building2 className="w-4 h-4 mr-1" />
                                  {job.company}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {job.location}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Сохранено {job.saved}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {job.skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {job.remote && <Badge className="bg-[#00C49A] text-white text-xs">Удаленно</Badge>}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[#0A2540]">{job.salary} ₽</p>
                              <p className="text-sm text-[#333333]">{job.type}</p>
                            </div>
                          </div>
                        </div>

                        <div className="ml-6 text-center">
                          <div className="relative w-16 h-16 mb-2">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="2"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#00C49A"
                                strokeWidth="2"
                                strokeDasharray={`${job.matchScore}, 100`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-[#00C49A]">{job.matchScore}</span>
                            </div>
                          </div>
                          <p className="text-xs text-[#333333] mb-3">Match</p>
                          <Button className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">Откликнуться</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#0A2540] mb-2">Нет сохраненных вакансий</h3>
                  <p className="text-[#333333] mb-6">Сохраняйте интересные вакансии, чтобы вернуться к ним позже</p>
                  <Link href="/job-seeker/search">
                    <Button className="bg-[#00C49A] hover:bg-[#00A085]">Найти вакансии</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
