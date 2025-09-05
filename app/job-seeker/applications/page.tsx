'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, User, Search, Settings, Heart, MapPin, Clock, Building2, Loader2, FileText } from "lucide-react"
import Link from "next/link"
import { getUserApplications } from "@/lib/jobs"
import { JobApplicationWithJob } from "@/lib/types"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

export default function Applications() {
  const [applications, setApplications] = useState<JobApplicationWithJob[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        loadApplications(user.id)
      } else {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const loadApplications = async (userId: string) => {
    try {
      setLoading(true)
      const data = await getUserApplications(userId)
      setApplications(data)
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      interview: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'На рассмотрении',
      reviewed: 'Рассмотрено',
      interview: 'Собеседование',
      accepted: 'Принято',
      rejected: 'Отклонено'
    }
    return labels[status as keyof typeof labels] || status
  }

  const formatSalary = (min: number, max: number) => {
    return `${min.toLocaleString()}-${max.toLocaleString()}`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Please login to view your applications</p>
            <Button asChild className="mt-4">
              <Link href="/auth/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
              href="/job-seeker/applications"
              className="flex items-center px-4 py-3 text-[#00C49A] bg-[#00C49A]/10 rounded-lg"
            >
              <FileText className="w-5 h-5 mr-3" />
              Мои заявки
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-[#0A2540] mb-8">Мои заявки</h1>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't applied to any jobs yet. Start browsing and applying!
                  </p>
                  <Button asChild>
                    <Link href="/job-seeker/search">Browse Jobs</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-semibold text-[#0A2540] mb-1">
                                {application.job.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-[#333333]">
                                <div className="flex items-center">
                                  <Building2 className="w-4 h-4 mr-1" />
                                  {application.job.company}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {application.job.location}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Applied {new Date(application.applied_at).toLocaleDateString('ru')}
                                </div>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(application.status)} border-0`}>
                              {getStatusLabel(application.status)}
                            </Badge>
                          </div>

                          <p className="text-[#333333] mb-4 line-clamp-2">
                            {application.job.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {application.job.skills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {application.job.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{application.job.skills.length - 3} more
                                </Badge>
                              )}
                              {application.job.remote && (
                                <Badge className="bg-[#00C49A] text-white text-xs">Удаленно</Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[#0A2540]">
                                {formatSalary(application.job.salary_min, application.job.salary_max)} ₽
                              </p>
                              <p className="text-sm text-[#333333]">
                                {application.job.job_type === 'full_time' ? 'Полная занятость' : application.job.job_type}
                              </p>
                            </div>
                          </div>

                          {application.cover_letter && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600 font-medium mb-1">Cover Letter:</p>
                              <p className="text-sm text-gray-800">{application.cover_letter}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}