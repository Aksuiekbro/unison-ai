import { z } from "zod"

// Job Seeker Profile Validation
export const jobSeekerProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
  title: z.string().optional(),
  summary: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  skills: z.array(z.string()).optional(),
})

export const jobSeekerExperienceSchema = z.object({
  position: z.string().min(1, "Position is required"),
  company: z.string().min(1, "Company is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  description: z.string().optional(),
  isCurrent: z.boolean().default(false),
})

export const jobSeekerEducationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  graduationYear: z.number().min(1900).max(new Date().getFullYear() + 10),
})

// Employer Profile Validation
export const employerProfileSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100),
  companyDescription: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  hrEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  hrContactName: z.string().optional(),
  companyCulture: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
})

export type JobSeekerProfileData = z.infer<typeof jobSeekerProfileSchema>
export type JobSeekerExperienceData = z.infer<typeof jobSeekerExperienceSchema>
export type JobSeekerEducationData = z.infer<typeof jobSeekerEducationSchema>
export type EmployerProfileData = z.infer<typeof employerProfileSchema>