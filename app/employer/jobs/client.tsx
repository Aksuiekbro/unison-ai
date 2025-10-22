'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Settings,
  Plus,
  Search,
  Users,
  Calendar,
  MoreHorizontal,
  Edit,
  Pause,
  Trash2,
  Play,
  X,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useJobs } from "@/hooks/use-jobs"
import { JobStatus } from "@/lib/actions/jobs"
import { toast } from "sonner"

interface EmployerJobsClientProps {
  userId: string
}

export default function EmployerJobsClient({ userId }: EmployerJobsClientProps) {
  const { jobs, loading, error, changeJobStatus, removeJob, fetchJobs } = useJobs(userId)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const [departmentFilter, setDepartmentFilter] = useState('all-dept')

  const handleSearch = () => {
    fetchJobs({
      search: searchQuery || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      department: departmentFilter !== 'all-dept' ? departmentFilter : undefined,
    })
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    const result = await changeJobStatus(jobId, newStatus)
    if (result.success) {
      toast.success('Статус вакансии обновлен')
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту вакансию?')) {
      const result = await removeJob(jobId)
      if (result.success) {
        toast.success('Вакансия удалена')
      } else {
        toast.error(result.error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500"
      case "draft":
        return "bg-gray-500"
      case "closed":
        return "bg-red-500"
      case "cancelled":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Активна"
      case "draft":
        return "Черновик"
      case "closed":
        return "Закрыта"
      case "cancelled":
        return "Отменена"
      default:
        return "Неизвестно"
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Ошибка: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            <p className="text-sm text-[#333333] mt-1">TechCorp Inc.</p>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/employer/dashboard"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Дашборд
            </Link>
            <Link
              href="/employer/jobs"
              className="flex items-center px-4 py-3 text-[#FF7A00] bg-[#FF7A00]/10 rounded-lg"
            >
              <Briefcase className="w-5 h-5 mr-3" />
              Вакансии
            </Link>
            <Link
              href="/employer/employees"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Users className="w-5 h-5 mr-3" />
              Сотрудники
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
              <h1 className="text-3xl font-bold text-[#0A2540]">Управление вакансиями</h1>
              <Link href="/employer/jobs/create">
                <Button className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Создать вакансию
                </Button>
              </Link>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Input 
                      placeholder="Поиск по названию вакансии..." 
                      className="h-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="published">Активные</SelectItem>
                      <SelectItem value="draft">Черновики</SelectItem>
                      <SelectItem value="closed">Закрытые</SelectItem>
                      <SelectItem value="cancelled">Отмененные</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-dept">Все отделы</SelectItem>
                      <SelectItem value="development">Разработка</SelectItem>
                      <SelectItem value="design">Дизайн</SelectItem>
                      <SelectItem value="mobile">Мобильная разработка</SelectItem>
                      <SelectItem value="devops">DevOps</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    className="bg-[#00C49A] hover:bg-[#00A085]"
                    onClick={handleSearch}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Найти
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">
                  {loading ? 'Загрузка...' : `Ваши вакансии (${jobs.length})`}
                </CardTitle>
                <CardDescription>Управляйте всеми открытыми позициями</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-[#333333]">Загрузка вакансий...</div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Нет вакансий</h3>
                    <p className="text-gray-500 mb-4">Создайте свою первую вакансию для привлечения кандидатов</p>
                    <Link href="/employer/jobs/create">
                      <Button className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Создать вакансию
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-[#0A2540]">{job.title}</h3>
                              <Badge className={`${getStatusColor(job.status)} text-white`}>
                                {getStatusText(job.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-[#333333] mb-3">
                              <span>{job.department}</span>
                              <span>{job.location}</span>
                              <span>{job.salary_min} - {job.salary_max} ₽</span>
                              <span>Опубликовано: {new Date(job.created_at).toLocaleDateString("ru-RU")}</span>
                            </div>
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-[#FF7A00]" />
                                <span className="font-medium">{job.views}</span>
                                <span className="text-[#333333] ml-1">просмотров</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {job.status === "published" && (
                              <Link href={`/employer/jobs/${job.id}/candidates`}>
                                <Button className="bg-[#00C49A] hover:bg-[#00A085] text-white">
                                  <Users className="w-4 h-4 mr-2" />
                                  Кандидаты
                                </Button>
                              </Link>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Редактировать
                                </DropdownMenuItem>
                                {job.status === "published" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'cancelled')}>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Снять с публикации
                                  </DropdownMenuItem>
                                ) : job.status === "cancelled" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'published')}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Опубликовать
                                  </DropdownMenuItem>
                                ) : job.status === "draft" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'published')}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Опубликовать
                                  </DropdownMenuItem>
                                ) : null}
                                {job.status !== "closed" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'closed')}>
                                    <X className="w-4 h-4 mr-2" />
                                    Закрыть
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDelete(job.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Удалить
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
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
  )
}