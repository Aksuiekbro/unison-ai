'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X, Save, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateJob, deleteJob, JobStatus, JobType, ExperienceLevel } from "@/lib/actions/jobs"
import { toast } from "sonner"
import { useI18n } from "@/components/i18n/I18nProvider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface JobData {
  id: string
  title: string
  description: string
  requirements: string | null
  responsibilities: string | null
  company_id: string
  job_type: JobType
  experience_level: ExperienceLevel
  salary_min: number | null
  salary_max: number | null
  currency: string | null
  location: string | null
  remote_allowed: boolean
  status: JobStatus
  posted_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  companies?: {
    id: string
    name: string
    logo_url: string | null
    owner_id?: string
  } | null
}

interface EditJobFormProps {
  job: JobData
  employerId: string
}

export function EditJobForm({ job, employerId }: EditJobFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Parse skills from requirements string
  const parseSkillsFromRequirements = (requirements: string | null): string[] => {
    if (!requirements) return []
    return requirements.split(',').map(s => s.trim()).filter(Boolean)
  }

  const [formData, setFormData] = useState({
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    salary_min: job.salary_min || 0,
    salary_max: job.salary_max || 0,
    location: job.location || '',
    job_type: job.job_type,
    experience_level: job.experience_level,
    status: job.status,
    remote_allowed: job.remote_allowed,
    currency: job.currency || 'rub',
    expires_at: job.expires_at,
  })

  const [skills, setSkills] = useState<string[]>(parseSkillsFromRequirements(job.requirements))
  const [benefits, setBenefits] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [newBenefit, setNewBenefit] = useState('')
  const { t } = useI18n()

  const handleSubmit = async (status: JobStatus) => {
    setLoading(true)
    
    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: skills.join(', '),
        salary_min: formData.salary_min || null,
        salary_max: formData.salary_max || null,
        location: formData.location || null,
        job_type: formData.job_type,
        experience_level: formData.experience_level,
        remote_allowed: formData.remote_allowed,
        currency: formData.currency,
        status,
      }
      
      const result = await updateJob(job.id, jobData, employerId)
      
      if (result.success) {
        toast.success(
          status === 'draft'
            ? t('employer.jobForm.toasts.draftSaved')
            : t('employer.editJobForm.toasts.updated')
        )
        router.push('/employer/jobs')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error(t('employer.editJobForm.toasts.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    
    try {
      const result = await deleteJob(job.id, employerId)
      
      if (result.success) {
        toast.success(t('employer.editJobForm.toasts.deleted'))
        router.push('/employer/jobs')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error(t('employer.editJobForm.toasts.deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit('')
    }
  }

  const removeBenefit = (benefitToRemove: string) => {
    setBenefits(benefits.filter(benefit => benefit !== benefitToRemove))
  }

  const getStatusBadge = () => {
    const statusColors: Record<JobStatus, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      closed: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    
    const statusLabels: Record<JobStatus, string> = {
      draft: t('employer.editJobForm.status.draft'),
      published: t('employer.editJobForm.status.published'),
      closed: t('employer.editJobForm.status.closed'),
      cancelled: t('employer.editJobForm.status.cancelled'),
    }
    
    return (
      <Badge className={statusColors[job.status]}>
        {statusLabels[job.status]}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/employer/jobs">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('employer.jobForm.back')}
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-[#0A2540]">{t('employer.editJobForm.title')}</h1>
                {getStatusBadge()}
              </div>
              <p className="text-[#333333] mt-1">{t('employer.editJobForm.subtitle')}</p>
            </div>
          </div>
          <Link href={`/employer/jobs/${job.id}/candidates`}>
            <Button variant="outline" size="sm">
              {t('employer.editJobForm.viewCandidates')}
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.jobForm.sections.basic.title')}</CardTitle>
                <CardDescription>{t('employer.jobForm.sections.basic.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('employer.jobForm.sections.basic.fields.title')}</Label>
                  <Input 
                    id="title" 
                    placeholder={t('employer.jobForm.sections.basic.fields.titlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">{t('employer.jobForm.sections.basic.fields.level')}</Label>
                    <Select 
                      value={formData.experience_level}
                      onValueChange={(value: ExperienceLevel) => setFormData({...formData, experience_level: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('employer.jobForm.sections.basic.fields.levelPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">{t('employer.jobForm.sections.basic.options.level.entry')}</SelectItem>
                        <SelectItem value="mid">{t('employer.jobForm.sections.basic.options.level.mid')}</SelectItem>
                        <SelectItem value="senior">{t('employer.jobForm.sections.basic.options.level.senior')}</SelectItem>
                        <SelectItem value="lead">{t('employer.jobForm.sections.basic.options.level.lead')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employment">{t('employer.jobForm.sections.basic.fields.employment')}</Label>
                    <Select 
                      value={formData.job_type}
                      onValueChange={(value: JobType) => setFormData({...formData, job_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('employer.jobForm.sections.basic.fields.employmentPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">{t('employer.jobForm.sections.basic.options.employment.full_time')}</SelectItem>
                        <SelectItem value="part_time">{t('employer.jobForm.sections.basic.options.employment.part_time')}</SelectItem>
                        <SelectItem value="contract">{t('employer.jobForm.sections.basic.options.employment.contract')}</SelectItem>
                        <SelectItem value="internship">{t('employer.jobForm.sections.basic.options.employment.internship')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">{t('employer.jobForm.sections.basic.fields.location')}</Label>
                    <Input 
                      id="location" 
                      placeholder={t('employer.jobForm.sections.basic.fields.locationPlaceholder')}
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="remote"
                      checked={formData.remote_allowed}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, remote_allowed: Boolean(checked) })
                      }
                    />
                    <Label htmlFor="remote">{t('employer.jobForm.sections.basic.fields.remote')}</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.jobForm.sections.salary.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaryFrom">{t('employer.jobForm.sections.salary.from')}</Label>
                    <Input 
                      id="salaryFrom" 
                      type="number"
                      min={0}
                      step={1000}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={t('employer.jobForm.sections.salary.placeholders.from')}
                      value={formData.salary_min || ''}
                      onChange={(e) => {
                        const num = parseInt(e.target.value)
                        const clamped = Number.isNaN(num) ? 0 : Math.max(0, num)
                        setFormData({ ...formData, salary_min: clamped })
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryTo">{t('employer.jobForm.sections.salary.to')}</Label>
                    <Input 
                      id="salaryTo" 
                      type="number"
                      min={0}
                      step={1000}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={t('employer.jobForm.sections.salary.placeholders.to')}
                      value={formData.salary_max || ''}
                      onChange={(e) => {
                        const num = parseInt(e.target.value)
                        const clamped = Number.isNaN(num) ? 0 : Math.max(0, num)
                        setFormData({ ...formData, salary_max: clamped })
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('employer.jobForm.sections.salary.currency')}</Label>
                    <Select 
                      value={formData.currency}
                      onValueChange={(value) => setFormData({...formData, currency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rub">{t('employer.jobForm.sections.salary.currencyOptions.rub')}</SelectItem>
                        <SelectItem value="usd">{t('employer.jobForm.sections.salary.currencyOptions.usd')}</SelectItem>
                        <SelectItem value="eur">{t('employer.jobForm.sections.salary.currencyOptions.eur')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="hideSalary" />
                  <Label htmlFor="hideSalary">{t('employer.jobForm.sections.salary.hide')}</Label>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.jobForm.sections.description.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description">{t('employer.jobForm.sections.description.fieldLabel')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('employer.jobForm.sections.description.placeholder')}
                    className="min-h-[120px]"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.jobForm.sections.skills.title')}</CardTitle>
                <CardDescription>{t('employer.jobForm.sections.skills.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                      <X 
                        className="w-3 h-3 ml-2 cursor-pointer" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input 
                    placeholder={t('employer.jobForm.sections.skills.addPlaceholder')}
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button 
                    className="bg-[#00C49A] hover:bg-[#00A085]"
                    onClick={addSkill}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.jobForm.sections.benefits.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {benefits.map((benefit) => (
                    <Badge key={benefit} variant="outline" className="px-3 py-1">
                      {benefit}
                      <X 
                        className="w-3 h-3 ml-2 cursor-pointer"
                        onClick={() => removeBenefit(benefit)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input 
                    placeholder={t('employer.jobForm.sections.benefits.addPlaceholder')}
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                  />
                  <Button 
                    className="bg-[#00C49A] hover:bg-[#00A085]"
                    onClick={addBenefit}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.jobForm.sidebar.actions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-[#FF7A00] hover:bg-[#E66A00]"
                  onClick={() => handleSubmit('published')}
                  disabled={loading || !formData.title || !formData.description}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? t('employer.editJobForm.actions.savingChanges') : t('employer.editJobForm.actions.saveChanges')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={() => handleSubmit('draft')}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? t('employer.jobForm.sidebar.actions.draftLoading') : t('employer.jobForm.sidebar.actions.draft')}
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Eye className="w-4 h-4 mr-2" />
                  {t('employer.jobForm.sidebar.actions.preview')}
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.jobForm.sidebar.settings.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">{t('employer.jobForm.sidebar.settings.deadline')}</Label>
                  <Input 
                    id="deadline" 
                    type="date" 
                    value={formData.expires_at ? new Date(formData.expires_at).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, expires_at: e.target.value || null})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positions">{t('employer.jobForm.sidebar.settings.positions')}</Label>
                  <Input id="positions" type="number" defaultValue="1" min="1" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="autoClose" />
                  <Label htmlFor="autoClose" className="text-sm">
                    {t('employer.jobForm.sidebar.settings.autoClose')}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* AI Matching */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.jobForm.sidebar.ai.title')}</CardTitle>
                <CardDescription>{t('employer.jobForm.sidebar.ai.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="aiMatching" defaultChecked />
                  <Label htmlFor="aiMatching" className="text-sm">
                    {t('employer.jobForm.sidebar.ai.enable')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="autoNotify" defaultChecked />
                  <Label htmlFor="autoNotify" className="text-sm">
                    {t('employer.jobForm.sidebar.ai.notify')}
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minMatch">{t('employer.jobForm.sidebar.ai.minMatch')}</Label>
                  <Input id="minMatch" type="number" defaultValue="70" min="0" max="100" />
                </div>
              </CardContent>
            </Card>

            {/* Job Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.editJobForm.jobInfo.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-[#333333]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('employer.editJobForm.jobInfo.created')}</span>
                    <span>{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('employer.editJobForm.jobInfo.updated')}</span>
                    <span>{new Date(job.updated_at).toLocaleDateString()}</span>
                  </div>
                  {job.posted_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('employer.editJobForm.jobInfo.published')}</span>
                      <span>{new Date(job.posted_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {job.companies?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('employer.editJobForm.jobInfo.company')}</span>
                      <span>{job.companies.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">{t('employer.editJobForm.dangerZone.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      disabled={deleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleting ? t('employer.editJobForm.dangerZone.deleting') : t('employer.editJobForm.dangerZone.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('employer.editJobForm.dangerZone.confirmTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('employer.editJobForm.dangerZone.confirmDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('employer.editJobForm.dangerZone.cancel')}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t('employer.editJobForm.dangerZone.confirmDelete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
