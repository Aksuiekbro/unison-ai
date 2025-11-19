'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Settings,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Clock,
  User,
  FileText,
  Star,
  Check,
  X,
  Eye,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useJobApplications } from "@/hooks/use-jobs"
import { useState } from "react"
import { Application } from "@/lib/actions/jobs"
import { toast } from "sonner"

export default function JobCandidates() {
  const params = useParams()
  const jobId = params.id as string
  
  // In a real app, this would come from auth context
  const employerId = 'usr_employer_1'
  
  const { applications, stats, loading, error, updateStatus } = useJobApplications(jobId, employerId)
  const [statusFilter, setStatusFilter] = useState<Application['status'] | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<'match_score' | 'date'>('match_score')

  const handleStatusUpdate = async (applicationId: string, newStatus: Application['status']) => {
    const result = await updateStatus(applicationId, newStatus)
    if (result.success) {
      toast.success('Статус заявки обновлен')
    } else {
      toast.error(result.error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "reviewing":
        return "bg-blue-500"
      case "interview":
        return "bg-indigo-500"
      case "interviewed":
        return "bg-purple-500"
      case "offered":
        return "bg-green-500"
      case "accepted":
        return "bg-teal-500"
      case "hired":
        return "bg-emerald-600"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "В ожидании"
      case "reviewing":
        return "На рассмотрении"
      case "interview":
        return "Назначено собеседование"
      case "interviewed":
        return "Собеседование"
      case "offered":
        return "Предложение"
      case "accepted":
        return "Предложение принято"
      case "hired":
        return "Принят"
      case "rejected":
        return "Отклонен"
      default:
        return "Неизвестно"
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesSearch = searchQuery === '' || 
      app.applicant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortMode === 'match_score') {
      const aScore = a.matchScore ?? a.matchScoreDetails?.overall_score ?? -1
      const bScore = b.matchScore ?? b.matchScoreDetails?.overall_score ?? -1
      if (aScore === bScore) {
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
      }
      return bScore - aScore
    }
    return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
  })

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Ошибка: {error}</p>
            <Link href="/employer/jobs">
              <Button className="mt-4">
                Вернуться к вакансиям
              </Button>
            </Link>
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
            <div className="flex items-center space-x-4 mb-8">
              <Link href="/employer/jobs">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  К списку вакансий
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-[#0A2540]">Кандидаты</h1>
                <p className="text-[#333333] mt-1">Управление заявками на вакансию</p>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-[#0A2540]">{stats.total}</div>
                    <div className="text-sm text-[#333333]">Всего</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-[#333333]">В ожидании</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.reviewing}</div>
                    <div className="text-sm text-[#333333]">Рассмотрение</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.interviewed}</div>
                    <div className="text-sm text-[#333333]">Собеседование</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.offered}</div>
                    <div className="text-sm text-[#333333]">Предложение</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-700">{stats.hired}</div>
                    <div className="text-sm text-[#333333]">Приняты</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                    <div className="text-sm text-[#333333]">Отклонены</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Input 
                      placeholder="Поиск по имени или email..." 
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
                      <SelectItem value="pending">В ожидании</SelectItem>
                      <SelectItem value="reviewing">На рассмотрении</SelectItem>
                      <SelectItem value="interviewed">Собеседование</SelectItem>
                      <SelectItem value="offered">Предложение</SelectItem>
                      <SelectItem value="hired">Приняты</SelectItem>
                      <SelectItem value="rejected">Отклонены</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortMode} onValueChange={(value: string) => setSortMode(value as 'match_score' | 'date')}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Сортировка" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match_score">По совместимости</SelectItem>
                      <SelectItem value="date">По дате отклика</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-[#00C49A] hover:bg-[#00A085]">
                    <Filter className="w-4 h-4 mr-2" />
                    Фильтр
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Экспорт
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Candidates List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">
                  {loading ? 'Загрузка...' : `Заявки (${filteredApplications.length})`}
                </CardTitle>
                <CardDescription>Список кандидатов на вакансию</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-[#333333]">Загрузка заявок...</div>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {applications.length === 0 ? 'Нет заявок' : 'Нет результатов'}
                    </h3>
                    <p className="text-gray-500">
                      {applications.length === 0 
                        ? 'Пока никто не откликнулся на эту вакансию' 
                        : 'Попробуйте изменить фильтры поиска'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedApplications.map((application) => {
                      const resumeLink = application.resumeUrl || application.resume_url || application.applicant.resume_url || null
                      const matchScoreValue = application.matchScore ?? application.matchScoreDetails?.overall_score ?? null
                      return (
                      <div key={application.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${application.applicant.full_name}`} />
                              <AvatarFallback>
                                {application.applicant.full_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-[#0A2540]">
                                  {application.applicant.full_name}
                                </h3>
                                <Badge className={`${getStatusColor(application.status)} text-white`}>
                                  {getStatusText(application.status)}
                                </Badge>
                                {matchScoreValue != null && (
                                  <Badge variant="outline" className="border-[#FF7A00] text-[#FF7A00]">
                                    AI {matchScoreValue}%
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-6 text-sm text-[#333333] mb-3">
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-1" />
                                  {application.applicant.email}
                                </div>
                                {application.applicant.phone && (
                                  <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-1" />
                                    {application.applicant.phone}
                                  </div>
                                )}
                                {application.applicant.location && (
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {application.applicant.location}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-6 text-sm text-[#333333] mb-3">
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Подано: {new Date(application.applied_at).toLocaleDateString("ru-RU")}
                                </div>
                                {application.applicant.experience_years != null && (
                                  <div className="flex items-center">
                                    <Briefcase className="w-4 h-4 mr-1" />
                                    Опыт: {application.applicant.experience_years} лет
                                  </div>
                                )}
                              </div>

                              {application.cover_letter && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-[#333333] line-clamp-3">
                                    {application.cover_letter}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            {resumeLink && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={resumeLink} target="_blank" rel="noreferrer" className="flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Резюме
                                </a>
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Действия
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/employer/candidates/${application.id}`} className="flex items-center">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Просмотр профиля
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={`mailto:${application.applicant.email}`} className="flex items-center">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Отправить письмо
                                  </a>
                                </DropdownMenuItem>
                                {application.status === 'pending' && (
                                  <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'reviewing')}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Взять на рассмотрение
                                  </DropdownMenuItem>
                                )}
                                {application.status === 'reviewing' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'interviewed')}>
                                      <User className="w-4 h-4 mr-2" />
                                      Пригласить на собеседование
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'rejected')}>
                                      <X className="w-4 h-4 mr-2" />
                                      Отклонить
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {application.status === 'interviewed' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'offered')}>
                                      <Check className="w-4 h-4 mr-2" />
                                      Сделать предложение
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'rejected')}>
                                      <X className="w-4 h-4 mr-2" />
                                      Отклонить
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {application.status === 'offered' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'hired')}>
                                      <Star className="w-4 h-4 mr-2" />
                                      Принять на работу
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'rejected')}>
                                      <X className="w-4 h-4 mr-2" />
                                      Отклонить
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )})}
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
