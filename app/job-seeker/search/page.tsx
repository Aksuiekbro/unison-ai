'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { LayoutDashboard, User, Search, Settings, Heart, MapPin, Clock, Building2, Filter, Loader2 } from "lucide-react"
import Link from "next/link"
import { searchJobs, applyToJob } from "@/lib/jobs"
import { Job, JobFilters } from "@/lib/types"
import { supabase } from "@/lib/supabase-client"
import { JobApplicationDialog } from "@/components/job-application-dialog"

export default function JobSearch() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [filters, setFilters] = useState<JobFilters>({})
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Load jobs
    loadJobs()
  }, [])

  const loadJobs = async (searchFilters: JobFilters = {}) => {
    try {
      setLoading(true)
      const jobData = await searchJobs(searchFilters)
      setJobs(jobData)
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (job: Job) => {
    if (!user) {
      toast.error('Please login to apply for jobs')
      return
    }

    setSelectedJob(job)
    setShowApplicationDialog(true)
  }

  const handleApplicationSuccess = () => {
    // Refresh jobs list or show success message
    loadJobs(filters)
  }

  const handleFilterChange = (key: keyof JobFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const applyFilters = () => {
    loadJobs(filters)
  }

  const formatSalary = (min: number, max: number) => {
    return `${min.toLocaleString()}-${max.toLocaleString()}`
  }

  const getJobTypeLabel = (type: string) => {
    const labels = {
      full_time: 'Полная занятость',
      part_time: 'Частичная занятость',
      contract: 'Контракт',
      freelance: 'Фриланс'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getExperienceLabel = (level: string) => {
    const labels = {
      junior: 'Junior',
      middle: 'Middle',
      senior: 'Senior',
      lead: 'Lead'
    }
    return labels[level as keyof typeof labels] || level
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
              className="flex items-center px-4 py-3 text-[#00C49A] bg-[#00C49A]/10 rounded-lg"
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
            <h1 className="text-3xl font-bold text-[#0A2540] mb-8">Поиск вакансий</h1>

            <div className="grid lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540] flex items-center">
                      <Filter className="w-5 h-5 mr-2" />
                      Фильтры
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Search Input */}
                    <div className="space-y-2">
                      <Label htmlFor="search">Поиск по ключевым словам</Label>
                      <Input 
                        id="search" 
                        placeholder="React, JavaScript..." 
                        value={filters.keywords || ''}
                        onChange={(e) => handleFilterChange('keywords', e.target.value)}
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Местоположение</Label>
                      <Input 
                        id="location" 
                        placeholder="Москва, Санкт-Петербург..."
                        value={filters.location || ''}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                      />
                    </div>

                    {/* Salary Range */}
                    <div className="space-y-2">
                      <Label>Зарплата (₽)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="От" 
                          type="number"
                          value={filters.salary_min || ''}
                          onChange={(e) => handleFilterChange('salary_min', parseInt(e.target.value) || undefined)}
                        />
                        <Input 
                          placeholder="До" 
                          type="number"
                          value={filters.salary_max || ''}
                          onChange={(e) => handleFilterChange('salary_max', parseInt(e.target.value) || undefined)}
                        />
                      </div>
                    </div>

                    {/* Employment Type */}
                    <div className="space-y-2">
                      <Label>Тип занятости</Label>
                      <Select value={filters.job_type || ''} onValueChange={(value) => handleFilterChange('job_type', value || undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Все типы</SelectItem>
                          <SelectItem value="full_time">Полная занятость</SelectItem>
                          <SelectItem value="part_time">Частичная занятость</SelectItem>
                          <SelectItem value="contract">Контракт</SelectItem>
                          <SelectItem value="freelance">Фриланс</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Remote Work */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="remote" 
                          checked={filters.remote || false}
                          onCheckedChange={(checked) => handleFilterChange('remote', checked || undefined)}
                        />
                        <Label htmlFor="remote" className="text-sm">
                          Удаленная работа
                        </Label>
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div className="space-y-2">
                      <Label>Уровень опыта</Label>
                      <Select value={filters.experience_level || ''} onValueChange={(value) => handleFilterChange('experience_level', value || undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите уровень" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Все уровни</SelectItem>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="middle">Middle</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={applyFilters} className="w-full bg-[#00C49A] hover:bg-[#00A085]">
                      Применить фильтры
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Job Results */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[#333333]">
                    {loading ? 'Загрузка...' : `Найдено ${jobs.length} вакансий`}
                  </p>
                  <Select defaultValue="date">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">По дате</SelectItem>
                      <SelectItem value="salary">По зарплате</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
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
                                      {new Date(job.created_at).toLocaleDateString('ru')}
                                    </div>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500">
                                  <Heart className="w-5 h-5" />
                                </Button>
                              </div>

                              <p className="text-[#333333] mb-4 line-clamp-2">{job.description}</p>

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
                                  <p className="font-semibold text-[#0A2540]">
                                    {formatSalary(job.salary_min, job.salary_max)} ₽
                                  </p>
                                  <p className="text-sm text-[#333333]">{getJobTypeLabel(job.job_type)}</p>
                                </div>
                              </div>
                            </div>

                            <div className="ml-6 text-center">
                              <div className="mb-3">
                                <Badge variant="outline" className="text-xs">
                                  {getExperienceLabel(job.experience_level)}
                                </Badge>
                              </div>
                              <Button 
                                onClick={() => handleApply(job)}
                                disabled={!user}
                                className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
                              >
                                Откликнуться
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {!loading && jobs.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">Вакансии не найдены. Попробуйте изменить фильтры поиска.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Load More */}
                {!loading && jobs.length > 0 && (
                  <div className="text-center mt-8">
                    <Button variant="outline" className="bg-transparent">
                      Загрузить еще
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <JobApplicationDialog
        job={selectedJob}
        isOpen={showApplicationDialog}
        onClose={() => setShowApplicationDialog(false)}
        userId={user?.id || null}
        onSuccess={handleApplicationSuccess}
      />
    </div>
  )
}