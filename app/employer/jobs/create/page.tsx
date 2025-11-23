'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X, Save, Eye } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createJob, JobStatus } from "@/lib/actions/jobs"
import { toast } from "sonner"
import { useI18n } from "@/components/i18n/I18nProvider"

export default function CreateJob() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [] as string[],
    salary_min: 0,
    salary_max: 0,
    location: '',
    department: '',
    employment_type: 'full_time' as const,
    experience_level: 'mid' as const,
    status: 'draft' as JobStatus,
    // These would normally come from auth context
    company_id: 'company_1',
    employer_id: 'usr_employer_1'
  })

  const [skills, setSkills] = useState(["React", "TypeScript", "JavaScript", "Node.js", "GraphQL"])
  const [benefits, setBenefits] = useState(["Medical insurance", "Flexible schedule", "Remote work"])
  const [newSkill, setNewSkill] = useState('')
  const [newBenefit, setNewBenefit] = useState('')
  const { t } = useI18n()

  const handleSubmit = async (status: JobStatus) => {
    setLoading(true)
    
    try {
      const jobData = {
        ...formData,
        requirements: skills,
        status
      }
      
      const result = await createJob(jobData)
      
      if (result.success) {
        toast.success(
          status === 'draft'
            ? t('employer.jobForm.toasts.draftSaved')
            : t('employer.jobForm.toasts.published')
        )
        router.push('/employer/jobs')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error(t('employer.jobForm.toasts.error'))
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/employer/jobs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('employer.jobForm.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540]">{t('employer.jobForm.title')}</h1>
            <p className="text-[#333333] mt-1">{t('employer.jobForm.subtitle')}</p>
          </div>
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
                    <Label htmlFor="department">{t('employer.jobForm.sections.basic.fields.department')}</Label>
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => setFormData({...formData, department: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('employer.jobForm.sections.basic.fields.departmentPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">{t('employer.jobForm.sections.basic.options.department.development')}</SelectItem>
                        <SelectItem value="design">{t('employer.jobForm.sections.basic.options.department.design')}</SelectItem>
                        <SelectItem value="mobile">{t('employer.jobForm.sections.basic.options.department.mobile')}</SelectItem>
                        <SelectItem value="qa">{t('employer.jobForm.sections.basic.options.department.qa')}</SelectItem>
                        <SelectItem value="devops">{t('employer.jobForm.sections.basic.options.department.devops')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">{t('employer.jobForm.sections.basic.fields.level')}</Label>
                    <Select 
                      value={formData.experience_level}
                      onValueChange={(value: any) => setFormData({...formData, experience_level: value})}
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
                  <div className="space-y-2">
                    <Label htmlFor="employment">{t('employer.jobForm.sections.basic.fields.employment')}</Label>
                    <Select 
                      value={formData.employment_type}
                      onValueChange={(value: any) => setFormData({...formData, employment_type: value})}
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

                <div className="flex items-center space-x-2">
                  <Checkbox id="remote" />
                  <Label htmlFor="remote">{t('employer.jobForm.sections.basic.fields.remote')}</Label>
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
                    <Select defaultValue="rub">
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
                  onClick={() => handleSubmit('active')}
                  disabled={loading || !formData.title || !formData.description}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? t('employer.jobForm.sidebar.actions.publishLoading') : t('employer.jobForm.sidebar.actions.publish')}
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
                  <Input id="deadline" type="date" />
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

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">{t('employer.jobForm.sidebar.tips.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-[#333333]">
                  <p>• {t('employer.jobForm.sidebar.tips.items.one')}</p>
                  <p>• {t('employer.jobForm.sidebar.tips.items.two')}</p>
                  <p>• {t('employer.jobForm.sidebar.tips.items.three')}</p>
                  <p>• {t('employer.jobForm.sidebar.tips.items.four')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}