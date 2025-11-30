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
import { useI18n } from "@/components/i18n/I18nProvider"
import { getIntlLocale } from "@/lib/i18n/utils"

interface EmployerJobsClientProps {
  userId: string
}

export default function EmployerJobsClient({ userId }: EmployerJobsClientProps) {
  const { jobs, loading, error, changeJobStatus, removeJob, fetchJobs } = useJobs(userId)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const { t, locale } = useI18n()
  const intlLocale = getIntlLocale(locale)
  const dateFormatter = new Intl.DateTimeFormat(intlLocale)

  const handleSearch = () => {
    fetchJobs({
      search: searchQuery || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    })
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    const result = await changeJobStatus(jobId, newStatus)
    if (result.success) {
      toast.success(t('employer.jobsList.toasts.statusUpdated'))
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (confirm(t('employer.jobsList.confirmDelete'))) {
      const result = await removeJob(jobId)
      if (result.success) {
        toast.success(t('employer.jobsList.toasts.jobDeleted'))
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
    const map: Record<string, string> = {
      published: t('employer.jobStatus.published'),
      draft: t('employer.jobStatus.draft'),
      closed: t('employer.jobStatus.closed'),
      cancelled: t('employer.jobStatus.cancelled'),
    }
    return map[status] || t('employer.jobStatus.paused')
  }

  const jobTypeLabels: Record<string, string> = {
    full_time: t('employer.jobForm.sections.basic.options.employment.full_time'),
    part_time: t('employer.jobForm.sections.basic.options.employment.part_time'),
    contract: t('employer.jobForm.sections.basic.options.employment.contract'),
    internship: t('employer.jobForm.sections.basic.options.employment.internship'),
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{t('employer.jobsList.errors.title', { message: error })}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              {t('common.actions.retry')}
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
            <p className="text-sm text-[#333333] mt-1">{t('employer.sidebar.placeholderCompany')}</p>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/employer/dashboard"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              {t('dashboardNav.dashboard')}
            </Link>
            <Link
              href="/employer/jobs"
              className="flex items-center px-4 py-3 text-[#FF7A00] bg-[#FF7A00]/10 rounded-lg"
            >
              <Briefcase className="w-5 h-5 mr-3" />
              {t('dashboardNav.manageJobs')}
            </Link>
            <Link
              href="/employer/employees"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Users className="w-5 h-5 mr-3" />
              {t('dashboardNav.employees')}
            </Link>
            <Link
              href="/employer/company"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Building2 className="w-5 h-5 mr-3" />
              {t('dashboardNav.companyProfile')}
            </Link>
            <Link
              href="/employer/settings"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5 mr-3" />
              {t('dashboardNav.settings')}
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#0A2540]">{t('employer.jobsList.title')}</h1>
              <Link href="/employer/jobs/create">
                <Button className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
                  <Plus className="w-4 h-4 mr-2" />
              {t('employer.jobsList.create')}
                </Button>
              </Link>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Input 
                      placeholder={t('employer.jobsList.searchPlaceholder')} 
                      className="h-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={t('employer.jobsList.filters.status.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('employer.jobsList.filters.status.all')}</SelectItem>
                      <SelectItem value="published">{t('employer.jobsList.filters.status.published')}</SelectItem>
                      <SelectItem value="draft">{t('employer.jobsList.filters.status.draft')}</SelectItem>
                      <SelectItem value="closed">{t('employer.jobsList.filters.status.closed')}</SelectItem>
                      <SelectItem value="cancelled">{t('employer.jobsList.filters.status.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    className="bg-[#00C49A] hover:bg-[#00A085]"
                    onClick={handleSearch}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {t('employer.jobsList.filters.apply')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">
                  {loading
                    ? t('employer.jobsList.table.loadingTitle')
                    : t('employer.jobsList.table.title', { count: jobs.length })}
                </CardTitle>
                <CardDescription>{t('employer.jobsList.table.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-[#333333]">{t('employer.jobsList.table.loading')}</div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('employer.jobsList.empty.title')}</h3>
                    <p className="text-gray-500 mb-4">{t('employer.jobsList.empty.description')}</p>
                    <Link href="/employer/jobs/create">
                      <Button className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('employer.jobsList.empty.cta')}
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
                              <span>{jobTypeLabels[job.job_type] || job.job_type}</span>
                              <span>{job.location}</span>
                              <span>{job.salary_min} - {job.salary_max} ₽</span>
                            <span>
                              {t('employer.jobsList.table.postedOn', {
                                date: dateFormatter.format(new Date(job.created_at)),
                              })}
                            </span>
                            </div>
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-[#FF7A00]" />
                              <span className="font-medium">
                                {t('employer.jobsList.table.views', { count: job.views ?? 0 })}
                              </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {job.status === "published" && (
                              <Link href={`/employer/jobs/${job.id}/candidates`}>
                                <Button className="bg-[#00C49A] hover:bg-[#00A085] text-white">
                                  <Users className="w-4 h-4 mr-2" />
                                {t('employer.jobsList.actions.manageCandidates')}
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
                                  {t('employer.jobsList.actions.edit')}
                                </DropdownMenuItem>
                                {job.status === "published" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'cancelled')}>
                                    <Pause className="w-4 h-4 mr-2" />
                                    {t('employer.jobsList.actions.pause')}
                                  </DropdownMenuItem>
                                ) : job.status === "cancelled" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'published')}>
                                    <Play className="w-4 h-4 mr-2" />
                                    {t('employer.jobsList.actions.publish')}
                                  </DropdownMenuItem>
                                ) : job.status === "draft" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'published')}>
                                    <Play className="w-4 h-4 mr-2" />
                                    {t('employer.jobsList.actions.publish')}
                                  </DropdownMenuItem>
                                ) : null}
                                {job.status !== "closed" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'closed')}>
                                    <X className="w-4 h-4 mr-2" />
                                    {t('employer.jobsList.actions.close')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDelete(job.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t('employer.jobsList.actions.delete')}
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
