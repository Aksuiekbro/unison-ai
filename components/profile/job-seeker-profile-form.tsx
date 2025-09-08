'use client'

import React, { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Upload, Plus, X } from "lucide-react"
import { jobSeekerProfileSchema, type JobSeekerProfileData } from '@/lib/validations'
import { updateJobSeekerProfile, addJobSeekerExperience, addJobSeekerEducation } from '@/app/actions/profile'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface JobSeekerProfileFormProps {
  initialData?: Partial<JobSeekerProfileData> & {
    skills?: string[]
  }
  experiences?: Array<{
    id: string
    position: string
    company: string
    startDate: string
    endDate?: string
    description?: string
    isCurrent: boolean
  }>
  education?: Array<{
    id: string
    institution: string
    degree: string
    fieldOfStudy: string
    graduationYear: number
  }>
  viewerEmail?: string
}

export default function JobSeekerProfileForm({ 
  initialData, 
  experiences = [], 
  education = [],
  viewerEmail,
}: JobSeekerProfileFormProps) {
  const { toast } = useToast();
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [skills, setSkills] = useState<string[]>(initialData?.skills || [])
  const [newSkill, setNewSkill] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedResume, setSelectedResume] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expOpen, setExpOpen] = useState(false)
  const [eduOpen, setEduOpen] = useState(false)
  const [expForm, setExpForm] = useState({ position: '', company: '', startDate: '', endDate: '', description: '', isCurrent: false })
  const [eduForm, setEduForm] = useState({ institution: '', degree: '', fieldOfStudy: '', graduationYear: '' })

  const form = useForm<JobSeekerProfileData>({
    resolver: zodResolver(jobSeekerProfileSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      title: initialData?.title || '',
      summary: initialData?.summary || '',
      phone: initialData?.phone || '',
      location: initialData?.location || '',
      linkedinUrl: initialData?.linkedinUrl || '',
      githubUrl: initialData?.githubUrl || '',
      skills: initialData?.skills || [],
    },
  })

  const onSubmit = (data: JobSeekerProfileData) => {
    startTransition(async () => {
      try {
        const formData = new FormData()

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'skills') {
              formData.append(key, JSON.stringify(skills))
            } else if (key === 'linkedinUrl' || key === 'githubUrl') {
              const v = value.toString().trim()
              const normalized = v && !/^https?:\/\//i.test(v) ? `https://${v}` : v
              formData.append(key, normalized)
            } else {
              formData.append(key, value.toString())
            }
          }
        })

        if (selectedResume) {
          formData.append('resume', selectedResume)
        }

        const result: any = await updateJobSeekerProfile(formData)

        if (!result || result.error) {
          toast({
            title: "Ошибка",
            description: (result && result.error) || 'Не удалось обновить профиль',
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Успех",
          description: "Профиль успешно обновлён",
        })
        router.refresh()
        setIsEditing(false)
      } catch (e: any) {
        toast({ title: 'Ошибка', description: e?.message || 'Неожиданная ошибка', variant: 'destructive' })
      }
    })
  }

  // Keep form in sync with server-provided initialData
  React.useEffect(() => {
    form.reset({
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      title: initialData?.title || '',
      summary: initialData?.summary || '',
      phone: initialData?.phone || '',
      location: initialData?.location || '',
      linkedinUrl: initialData?.linkedinUrl || '',
      githubUrl: initialData?.githubUrl || '',
      skills: initialData?.skills || [],
    })
    setSkills(initialData?.skills || [])
  }, [initialData])

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const firstName = isEditing ? (form.watch('firstName') || '') : (initialData?.firstName || '')
  const lastName = isEditing ? (form.watch('lastName') || '') : (initialData?.lastName || '')
  const title = isEditing ? (form.watch('title') || '') : (initialData?.title || '')
  const location = isEditing ? (form.watch('location') || '') : (initialData?.location || '')
  const summary = isEditing ? (form.watch('summary') || '') : (initialData?.summary || '')
  const linkedinUrl = isEditing ? (form.watch('linkedinUrl') || '') : (initialData?.linkedinUrl || '')
  const githubUrl = isEditing ? (form.watch('githubUrl') || '') : (initialData?.githubUrl || '')

  const missing: string[] = []
  if (!firstName) missing.push('Имя')
  if (!lastName) missing.push('Фамилия')
  if (!title) missing.push('Желаемая должность')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#0A2540]">Мой профиль</h1>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-[#00C49A] hover:bg-[#00A085]"
          >
            {missing.length > 0 ? 'Заполните недостающую информацию' : 'Изменить профиль'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending}
              className="bg-[#00C49A] hover:bg-[#00A085]"
            >
              {isPending ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Назад к профилю</Button>
          </div>
        )}
      </div>

      {/* Profile Preview */}
      {!isEditing && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-[#0A2540]">Публичный профиль</CardTitle>
            {missing.length > 0 && (
              <CardDescription>
                Отсутствует: {missing.join(', ')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-[#0A2540]">
                  {[firstName, lastName].filter(Boolean).join(' ') || viewerEmail || 'Unnamed User'}
                </h2>
                <p className="text-sm text-[#333333]">{title || '—'}</p>
                <p className="text-sm text-gray-500">{location || '—'}</p>
              </div>

              {/* About */}
              <section>
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">О себе</h3>
                <p className="text-sm text-[#333333] whitespace-pre-wrap">{summary || '—'}</p>
              </section>

              {/* Contact Info */}
              <section>
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Контактная информация</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Эл. почта: </span>
                    <span className="text-[#0A2540]">{viewerEmail || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Телефон: </span>
                    <span className="text-[#0A2540]">{form.watch('phone') || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Местоположение: </span>
                    <span className="text-[#0A2540]">{location || '—'}</span>
                  </div>
                </div>
              </section>

              {/* Portfolio Links */}
              <section>
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Портфолио</h3>
                <div className="flex flex-wrap gap-3 text-sm">
                  <a href={linkedinUrl || '#'} className="underline text-[#00C49A]" target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                  <a href={githubUrl || '#'} className="underline text-[#00C49A]" target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                </div>
              </section>

              {/* Education */}
              <section>
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Образование</h3>
                {education && education.length > 0 ? (
                  <div className="space-y-2">
                    {education.map((edu) => (
                      <div key={edu.id} className="text-sm">
                        <p className="font-medium text-[#0A2540]">{edu.degree} • {edu.fieldOfStudy}</p>
                        <p className="text-[#333333]">{edu.institution}</p>
                        <p className="text-gray-500">{edu.graduationYear}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </section>

              {/* Experience */}
              <section>
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Опыт работы</h3>
                {experiences && experiences.length > 0 ? (
                  <div className="space-y-2">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="text-sm">
                        <p className="font-medium text-[#0A2540]">{exp.position} • {exp.company}</p>
                        <p className="text-gray-500">{exp.startDate} - {exp.isCurrent ? 'Настоящее время' : exp.endDate || '—'}</p>
                        {exp.description && <p className="text-[#333333]">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </section>

              {/* Skills */}
              <section>
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Навыки</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? skills.map((s) => (
                    <Badge key={s} variant="secondary" className="px-3 py-1">{s}</Badge>
                  )) : <span className="text-sm text-gray-500">—</span>}
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      )}

      {isEditing && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-[#0A2540]">Загрузить резюме</CardTitle>
            <CardDescription>Поддерживаемые форматы: PDF, DOC, DOCX</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#00C49A] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
              }}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) setSelectedResume(file)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[#333333] mb-2">Drag and drop your file here or click to browse</p>
              {selectedResume && (
                <p className="text-sm text-gray-600 mb-2">Selected: {selectedResume.name}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                name="resume"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setSelectedResume(file || null)
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="border-[#00C49A] text-[#00C49A] bg-transparent"
                onClick={() => fileInputRef.current?.click()}
              >
                Выбрать файл
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isEditing && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Личная информация</TabsTrigger>
              <TabsTrigger value="experience">Опыт</TabsTrigger>
              <TabsTrigger value="education">Образование</TabsTrigger>
              <TabsTrigger value="skills">Навыки</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0A2540]">Личная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя</FormLabel>
                          <FormControl>
                            <Input placeholder="Иван" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Фамилия</FormLabel>
                          <FormControl>
                            <Input placeholder="Иванов" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Желаемая должность</FormLabel>
                        <FormControl>
                          <Input placeholder="Frontend-разработчик" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>О себе</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Расскажите о себе, о своих целях и мотивации..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон</FormLabel>
                          <FormControl>
                            <Input placeholder="+7 (777) 123-45-67" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Местоположение</FormLabel>
                          <FormControl>
                            <Input placeholder="Алматы, Казахстан" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="linkedinUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="githubUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub</FormLabel>
                          <FormControl>
                            <Input placeholder="https://github.com/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#0A2540]">Опыт работы</CardTitle>
                    <Button size="sm" className="bg-[#00C49A] hover:bg-[#00A085]" onClick={() => setExpOpen(true)} type="button">
                      <Plus className="w-4 h-4 mr-1" />
                      Добавить опыт
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-[#0A2540]">{exp.position}</h4>
                      <p className="text-[#333333]">{exp.company}</p>
                      <p className="text-sm text-gray-500">
                        {exp.startDate} - {exp.isCurrent ? 'Настоящее время' : exp.endDate}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-sm text-[#333333]">{exp.description}</p>
                      )}
                    </div>
                  ))}
                  
                  {experiences.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Опыт работы пока не добавлен. Нажмите "Добавить опыт" для начала.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#0A2540]">Образование</CardTitle>
                    <Button size="sm" className="bg-[#00C49A] hover:bg-[#00A085]" onClick={() => setEduOpen(true)} type="button">
                      <Plus className="w-4 h-4 mr-1" />
                      Добавить образование
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {education.map((edu) => (
                    <div key={edu.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-[#0A2540]">{edu.degree}</h4>
                      <p className="text-[#333333]">{edu.institution}</p>
                      <p className="text-sm text-gray-500">
                        {edu.fieldOfStudy} • {edu.graduationYear}
                      </p>
                    </div>
                  ))}
                  
                  {education.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Образование пока не добавлено. Нажмите "Добавить образование" для начала.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0A2540]">Навыки и технологии</CardTitle>
                  <CardDescription>Добавьте ключевые навыки</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Добавить навык</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="напр. React, JavaScript, Python..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <Button 
                        type="button"
                        onClick={addSkill}
                        className="bg-[#00C49A] hover:bg-[#00A085]"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-[#0A2540]">Ваши навыки:</h4>
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
                    {skills.length === 0 && (
                      <p className="text-gray-500">Навыки пока не добавлены.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          </form>
        </Form>
      )}

      {/* Add Experience Dialog */}
      <Dialog open={expOpen} onOpenChange={setExpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить опыт</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Должность</Label>
                <Input value={expForm.position} onChange={(e) => setExpForm({ ...expForm, position: e.target.value })} />
              </div>
              <div>
                <Label>Компания</Label>
                <Input value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Дата начала</Label>
                <Input type="date" value={expForm.startDate} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} />
              </div>
              <div>
                <Label>Дата окончания</Label>
                <Input type="date" value={expForm.endDate} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })} disabled={expForm.isCurrent} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isCurrent" checked={expForm.isCurrent} onCheckedChange={(checked) => setExpForm({ ...expForm, isCurrent: Boolean(checked) })} />
              <Label htmlFor="isCurrent">Я работаю здесь сейчас</Label>
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpOpen(false)} type="button">Отмена</Button>
            <Button
              onClick={() => {
                startTransition(async () => {
                  const fd = new FormData()
                  fd.append('position', expForm.position)
                  fd.append('company', expForm.company)
                  fd.append('startDate', expForm.startDate)
                  if (expForm.endDate) fd.append('endDate', expForm.endDate)
                  fd.append('description', expForm.description)
                  fd.append('isCurrent', String(expForm.isCurrent))
                  const res = await addJobSeekerExperience(fd)
                  if ((res as any)?.error) {
                    toast({ title: 'Ошибка', description: (res as any).error, variant: 'destructive' })
                  } else {
                    toast({ title: 'Успех', description: 'Опыт добавлен' })
                    setExpOpen(false)
                    setExpForm({ position: '', company: '', startDate: '', endDate: '', description: '', isCurrent: false })
                    router.refresh()
                  }
                })
              }}
              disabled={isPending}
              className="bg-[#00C49A] hover:bg-[#00A085]"
              type="button"
            >
              {isPending ? 'Сохранение...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Education Dialog */}
      <Dialog open={eduOpen} onOpenChange={setEduOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить образование</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Учебное заведение</Label>
                <Input value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} />
              </div>
              <div>
                <Label>Степень</Label>
                <Input value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Область изучения</Label>
              <Input value={eduForm.fieldOfStudy} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} />
            </div>
            <div>
              <Label>Год окончания</Label>
              <Input type="number" value={eduForm.graduationYear} onChange={(e) => setEduForm({ ...eduForm, graduationYear: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEduOpen(false)} type="button">Отмена</Button>
            <Button
              onClick={() => {
                startTransition(async () => {
                  const fd = new FormData()
                  fd.append('institution', eduForm.institution)
                  fd.append('degree', eduForm.degree)
                  fd.append('fieldOfStudy', eduForm.fieldOfStudy)
                  fd.append('graduationYear', eduForm.graduationYear)
                  const res = await addJobSeekerEducation(fd)
                  if ((res as any)?.error) {
                    toast({ title: 'Ошибка', description: (res as any).error, variant: 'destructive' })
                  } else {
                    toast({ title: 'Успех', description: 'Образование добавлено' })
                    setEduOpen(false)
                    setEduForm({ institution: '', degree: '', fieldOfStudy: '', graduationYear: '' })
                    router.refresh()
                  }
                })
              }}
              disabled={isPending}
              className="bg-[#00C49A] hover:bg-[#00A085]"
              type="button"
            >
              {isPending ? 'Сохранение...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}