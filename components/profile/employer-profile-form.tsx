'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Upload, MapPin, Plus, X } from "lucide-react"
import { employerProfileSchema, type EmployerProfileData } from '@/lib/validations'
import { updateEmployerProfile } from '@/app/actions/profile'

interface EmployerProfileFormProps {
  initialData?: Partial<EmployerProfileData> & {
    benefits?: string[]
    technologies?: string[]
  }
}

export default function EmployerProfileForm({ initialData }: EmployerProfileFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [benefits, setBenefits] = useState<string[]>(initialData?.benefits || [])
  const [technologies, setTechnologies] = useState<string[]>(initialData?.technologies || [])
  const [newBenefit, setNewBenefit] = useState('')
  const [newTechnology, setNewTechnology] = useState('')

  const form = useForm<EmployerProfileData>({
    resolver: zodResolver(employerProfileSchema),
    defaultValues: {
      companyName: initialData?.companyName || '',
      companyDescription: initialData?.companyDescription || '',
      industry: initialData?.industry || '',
      companySize: initialData?.companySize || '',
      foundedYear: initialData?.foundedYear || undefined,
      websiteUrl: initialData?.websiteUrl || '',
      country: initialData?.country || '',
      city: initialData?.city || '',
      address: initialData?.address || '',
      hrEmail: initialData?.hrEmail || '',
      phone: initialData?.phone || '',
      hrContactName: initialData?.hrContactName || '',
      companyCulture: initialData?.companyCulture || '',
      benefits: initialData?.benefits || [],
      technologies: initialData?.technologies || [],
    },
  })

  const onSubmit = (data: EmployerProfileData) => {
    startTransition(async () => {
      const formData = new FormData()
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'benefits') {
            formData.append(key, JSON.stringify(benefits))
          } else if (key === 'technologies') {
            formData.append(key, JSON.stringify(technologies))
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      const result = await updateEmployerProfile(formData)
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Company profile updated successfully",
        })
      }
    })
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

  const addTechnology = () => {
    if (newTechnology.trim() && !technologies.includes(newTechnology.trim())) {
      setTechnologies([...technologies, newTechnology.trim()])
      setNewTechnology('')
    }
  }

  const removeTechnology = (technologyToRemove: string) => {
    setTechnologies(technologies.filter(tech => tech !== technologyToRemove))
  }

  const handleBenefitKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addBenefit()
    }
  }

  const handleTechnologyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTechnology()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#0A2540]">Company Profile</h1>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isPending}
          className="bg-[#FF7A00] hover:bg-[#E66A00]"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" />
                    <AvatarFallback className="text-2xl">
                      {form.watch('companyName')?.slice(0, 2).toUpperCase() || 'CO'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-transparent"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="TechCorp Inc." 
                              className="text-lg font-semibold" 
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
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input placeholder="Information Technology" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="companySize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Size</FormLabel>
                            <FormControl>
                              <Input placeholder="50-100 employees" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Basic Information</CardTitle>
              <CardDescription>Tell candidates about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="companyDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your mission, values and company activities..."
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
                  name="foundedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Founded Year</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="2018" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://techcorp.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A2540] flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Tech Street, Suite 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Benefits and Perks</CardTitle>
              <CardDescription>What do you offer to your employees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {benefits.map((benefit) => (
                  <Badge key={benefit} variant="secondary" className="px-3 py-1">
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
                  placeholder="Add benefit..." 
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyPress={handleBenefitKeyPress}
                />
                <Button 
                  type="button"
                  onClick={addBenefit}
                  className="bg-[#00C49A] hover:bg-[#00A085]"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Technologies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Technologies and Tools</CardTitle>
              <CardDescription>Your company's technology stack</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {technologies.map((tech) => (
                  <Badge key={tech} variant="outline" className="px-3 py-1">
                    {tech}
                    <X 
                      className="w-3 h-3 ml-2 cursor-pointer" 
                      onClick={() => removeTechnology(tech)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Add technology..." 
                  value={newTechnology}
                  onChange={(e) => setNewTechnology(e.target.value)}
                  onKeyPress={handleTechnologyKeyPress}
                />
                <Button 
                  type="button"
                  onClick={addTechnology}
                  className="bg-[#00C49A] hover:bg-[#00A085]"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Company Culture */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Company Culture</CardTitle>
              <CardDescription>Tell us about work atmosphere and values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="companyCulture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Culture Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe work atmosphere, team values, approach to work..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hrEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HR Department Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="hr@techcorp.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
              <FormField
                control={form.control}
                name="hrContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HR Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Anna Smith, HR Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}