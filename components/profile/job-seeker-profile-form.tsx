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
            title: "Error",
            description: (result && result.error) || 'Failed to update profile',
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        router.refresh()
        setIsEditing(false)
      } catch (e: any) {
        toast({ title: 'Error', description: e?.message || 'Unexpected error', variant: 'destructive' })
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
  if (!firstName) missing.push('First name')
  if (!lastName) missing.push('Last name')
  if (!title) missing.push('Desired position')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#0A2540]">My Profile</h1>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-[#00C49A] hover:bg-[#00A085]"
          >
            {missing.length > 0 ? 'Fill in missing info' : 'Edit profile'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending}
              className="bg-[#00C49A] hover:bg-[#00A085]"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Back to profile</Button>
          </div>
        )}
      </div>

      {/* Profile Preview */}
      {!isEditing && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-[#0A2540]">Public Profile</CardTitle>
            {missing.length > 0 && (
              <CardDescription>
                Missing: {missing.join(', ')}
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
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">About</h3>
                <p className="text-sm text-[#333333] whitespace-pre-wrap">{summary || '—'}</p>
              </section>

              {/* Contact Info */}
              <section>
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Contact Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Email: </span>
                    <span className="text-[#0A2540]">{viewerEmail || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone: </span>
                    <span className="text-[#0A2540]">{form.watch('phone') || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Location: </span>
                    <span className="text-[#0A2540]">{location || '—'}</span>
                  </div>
                </div>
              </section>

              {/* Portfolio Links */}
              <section>
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Portfolio Links</h3>
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
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Education</h3>
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
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Experience</h3>
                {experiences && experiences.length > 0 ? (
                  <div className="space-y-2">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="text-sm">
                        <p className="font-medium text-[#0A2540]">{exp.position} • {exp.company}</p>
                        <p className="text-gray-500">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate || '—'}</p>
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
                <h3 className="text-sm font-semibold text-[#0A2540] mb-2">Skills</h3>
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
            <CardTitle className="text-[#0A2540]">Upload Your Resume</CardTitle>
            <CardDescription>Supported formats: PDF, DOC, DOCX</CardDescription>
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
                Choose File
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
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0A2540]">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
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
                        <FormLabel>Desired Position</FormLabel>
                        <FormControl>
                          <Input placeholder="Frontend Developer" {...field} />
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
                        <FormLabel>About Me</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself, your goals and motivation..."
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
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
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="New York, NY" {...field} />
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
                    <CardTitle className="text-[#0A2540]">Work Experience</CardTitle>
                    <Button size="sm" className="bg-[#00C49A] hover:bg-[#00A085]" onClick={() => setExpOpen(true)} type="button">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Experience
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-[#0A2540]">{exp.position}</h4>
                      <p className="text-[#333333]">{exp.company}</p>
                      <p className="text-sm text-gray-500">
                        {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-sm text-[#333333]">{exp.description}</p>
                      )}
                    </div>
                  ))}
                  
                  {experiences.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No work experience added yet. Click "Add Experience" to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#0A2540]">Education</CardTitle>
                    <Button size="sm" className="bg-[#00C49A] hover:bg-[#00A085]" onClick={() => setEduOpen(true)} type="button">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Education
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
                      No education added yet. Click "Add Education" to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0A2540]">Skills and Technologies</CardTitle>
                  <CardDescription>Add your key skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Add Skill</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="e.g. React, JavaScript, Python..."
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
                    <h4 className="font-semibold text-[#0A2540]">Your Skills:</h4>
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
                      <p className="text-gray-500">No skills added yet.</p>
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
            <DialogTitle>Add Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Position</Label>
                <Input value={expForm.position} onChange={(e) => setExpForm({ ...expForm, position: e.target.value })} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={expForm.startDate} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={expForm.endDate} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })} disabled={expForm.isCurrent} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isCurrent" checked={expForm.isCurrent} onCheckedChange={(checked) => setExpForm({ ...expForm, isCurrent: Boolean(checked) })} />
              <Label htmlFor="isCurrent">I currently work here</Label>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpOpen(false)} type="button">Cancel</Button>
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
                    toast({ title: 'Error', description: (res as any).error, variant: 'destructive' })
                  } else {
                    toast({ title: 'Success', description: 'Experience added' })
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
              {isPending ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Education Dialog */}
      <Dialog open={eduOpen} onOpenChange={setEduOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Institution</Label>
                <Input value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} />
              </div>
              <div>
                <Label>Degree</Label>
                <Input value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Field of Study</Label>
              <Input value={eduForm.fieldOfStudy} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} />
            </div>
            <div>
              <Label>Graduation Year</Label>
              <Input type="number" value={eduForm.graduationYear} onChange={(e) => setEduForm({ ...eduForm, graduationYear: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEduOpen(false)} type="button">Cancel</Button>
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
                    toast({ title: 'Error', description: (res as any).error, variant: 'destructive' })
                  } else {
                    toast({ title: 'Success', description: 'Education added' })
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
              {isPending ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}