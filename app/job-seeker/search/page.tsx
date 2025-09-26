'use client'

import { useState, useEffect, useMemo, useCallback } from "react"
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
import { searchJobsWithMatchScores, JobWithMatchScore } from "@/lib/services/match-service"
import { JobFilters } from "@/lib/types"
import { JobApplicationDialog } from "@/components/job-application-dialog"
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'
import type { User as AuthUser } from '@supabase/supabase-js'

export default function JobSearch() {
  const [jobs, setJobs] = useState<JobWithMatchScore[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [filters, setFilters] = useState<JobFilters>({})
  const [selectedJob, setSelectedJob] = useState<JobWithMatchScore | null>(null)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)

  const supabase = useMemo(() => createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  const loadJobs = useCallback(async (searchFilters: JobFilters = {}) => {
    try {
      setLoading(true)
      const jobData = await searchJobsWithMatchScores(user?.id || null, searchFilters)
      setJobs(jobData)
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      // Reload jobs when user changes to recalculate match scores
      loadJobs()
    }
    getUser()
  }, [supabase, loadJobs])

  // Load or reload jobs when authenticated user identity (id) or filters change
  useEffect(() => {
    if (user?.id !== undefined) {
      loadJobs(JSON.parse(filtersKey) as JobFilters)
    }
  }, [user?.id, filtersKey, loadJobs])

  

  const handleApply = async (job: JobWithMatchScore) => {
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

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min || !max) return 'По договоренности'
    return `${min.toLocaleString()}-${max.toLocaleString()}`
  }

  const getJobTypeLabel = (type: string) => {
    const labels = {
      full_time: 'Полная занятость',
      part_time: 'Частичная занятость',
      contract: 'Контракт',
      internship: 'Стажировка'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getExperienceLabel = (level: string) => {
    const labels = {
      entry: 'Entry',
      junior: 'Junior',
      mid: 'Middle',
      senior: 'Senior',
      executive: 'Executive'
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
                        placeholder="React, JavaScript, Python, Java..." 
                        value={filters.keywords || ''}
                        onChange={(e) => handleFilterChange('keywords', e.target.value)}
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Местоположение</Label>
                      <Input 
                        id="location" 
                        placeholder="Алматы, Астана, Шымкент..."
                        value={filters.location || ''}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                      />
                    </div>

                    {/* Salary Range */}
                    <div className="space-y-2">
                      <Label>Зарплата (₸)</Label>
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
                      <Select value={filters.job_type || 'all'} onValueChange={(value) => handleFilterChange('job_type', value === 'all' ? undefined : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все типы</SelectItem>
                          <SelectItem value="full_time">Полная занятость</SelectItem>
                          <SelectItem value="part_time">Частичная занятость</SelectItem>
                          <SelectItem value="contract">Контракт</SelectItem>
                          <SelectItem value="internship">Стажировка</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Remote Work */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="remote" 
                          checked={filters.remote_allowed || false}
                          onCheckedChange={(checked) => {
                            if (checked === true) return handleFilterChange('remote_allowed', true)
                            if (checked === false) return handleFilterChange('remote_allowed', false)
                            return handleFilterChange('remote_allowed', undefined)
                          }}
                        />
                        <Label htmlFor="remote" className="text-sm">
                          Удаленная работа
                        </Label>
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div className="space-y-2">
                      <Label>Уровень опыта</Label>
                      <Select value={filters.experience_level || 'all'} onValueChange={(value) => handleFilterChange('experience_level', value === 'all' ? undefined : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите уровень" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все уровни</SelectItem>
                          <SelectItem value="entry">Entry</SelectItem>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="mid">Middle</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
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
                  <Select defaultValue="match_score">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match_score">По совместимости</SelectItem>
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
                                      {job.companies?.name || 'Unknown Company'}
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
                                  {/* Display job skills */}
                                  {job.job_skills?.filter(Boolean)?.slice(0, 3)?.map((jobSkill) => (
                                    <Badge key={jobSkill?.id} variant={jobSkill?.required ? "default" : "secondary"} className="text-xs">
                                      {jobSkill?.skills?.name}
                                    </Badge>
                                  ))}
                                  {(job.job_skills?.length ?? 0) > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{(job.job_skills?.length ?? 0) - 3} more
                                    </Badge>
                                  )}
                                  {job.remote_allowed && <Badge className="bg-[#00C49A] text-white text-xs">Удаленно</Badge>}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-[#0A2540]">
                                    {formatSalary(job.salary_min, job.salary_max)} ₸
                                  </p>
                                  <p className="text-sm text-[#333333]">{getJobTypeLabel(job.job_type)}</p>
                                </div>
                              </div>
                            </div>

                            <div className="ml-6 text-center">
                              {/* AI Match Score */}
                              <div className="mb-3">
                                <div className="bg-gradient-to-r from-[#00C49A] to-[#00A085] text-white px-3 py-2 rounded-lg mb-2">
                                  <div className="text-sm font-medium">Совместимость</div>
                                  <div className="text-2xl font-bold">
                                    {job.matchScore ? `${job.matchScore}%` : 'N/A'}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {getExperienceLabel(job.experience_level)}
                                </Badge>
                              </div>
                              <Button 
                                onClick={() => handleApply(job)}
                                disabled={!user}
                                className="bg-[#FF7A00] hover:bg-[#E66A00] text-white w-full"
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