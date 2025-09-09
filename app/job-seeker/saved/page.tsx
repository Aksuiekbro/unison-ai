import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, User, Search, Settings, Heart, MapPin, Clock, Building2, Trash2 } from "lucide-react"
import Link from "next/link"
import { getSavedJobs, unsaveJob } from "@/actions/saved-jobs"
import { revalidatePath } from "next/cache"

async function handleUnsaveJob(jobId: string) {
  'use server'
  await unsaveJob(jobId)
  revalidatePath('/job-seeker/saved')
}

export default async function SavedJobs() {
  const savedJobs = await getSavedJobs()

  const formatSalary = (min?: number | null, max?: number | null, currency?: string | null) => {
    if (!min && !max) return "—"
    const cur = currency || "₸"
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${cur}`
    return `${(min || max || 0).toLocaleString()} ${cur}`
  }

  const formatSavedDate = (iso?: string) => {
    if (!iso) return "—"
    try {
      return new Date(iso).toLocaleDateString("ru-RU")
    } catch {
      return "—"
    }
  }

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
                {savedJobs.map((saved) => (
                  <Card key={saved.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-semibold text-[#0A2540] mb-1">{saved.job?.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-[#333333]">
                                <div className="flex items-center">
                                  <Building2 className="w-4 h-4 mr-1" />
                                  {saved.job?.company?.name || "Компания не указана"}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {saved.job?.location || "—"}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Сохранено {formatSavedDate(saved.created_at)}
                                </div>
                              </div>
                            </div>
                            <form action={saved.job?.id ? handleUnsaveJob.bind(null, saved.job.id) : undefined}>
                              <Button type="submit" variant="ghost" size="sm" className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </form>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {saved.job?.remote_allowed ? (
                                <Badge className="bg-[#00C49A] text-white text-xs">Удаленно</Badge>
                              ) : null}
                              <Badge variant="secondary" className="text-xs">
                                {saved.job?.job_type}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[#0A2540]">
                                {formatSalary(saved.job?.salary_min, saved.job?.salary_max, saved.job?.currency)}
                              </p>
                              <p className="text-sm text-[#333333]">{saved.job?.job_type}</p>
                            </div>
                          </div>
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
