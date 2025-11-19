export interface Job {
  id: string
  title: string
  description: string
  requirements: string | null
  responsibilities: string | null
  company_id: string
  employer_id: string
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
  experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
  salary_min: number | null
  salary_max: number | null
  currency: string
  location: string | null
  remote_allowed: boolean
  status: 'draft' | 'published' | 'closed' | 'cancelled'
  posted_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  companies?: {
    id: string
    name: string
    logo_url: string | null
    industry: string | null
    size: string | null
    location: string | null
    description: string | null
    website: string | null
  }
  job_skills?: Array<{
    id: string
    skill_id: string
    required: boolean
    skills: {
      id: string
      name: string
      category: string | null
    }
  }>
}

export interface JobApplication {
  id: string
  job_id: string
  applicant_id: string
  status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected'
  cover_letter: string | null
  resume_url: string | null
  notes: string | null
  applied_at: string
  updated_at: string
  job?: Job
  applicant?: {
    id: string
    full_name: string
    email: string
    phone: string | null
    location: string | null
    bio: string | null
  }
}

export interface JobApplicationWithJob extends JobApplication {
  job: Job
}

export interface JobFilters {
  location?: string
  job_type?: 'full_time' | 'part_time' | 'contract' | 'internship'
  experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
  remote_allowed?: boolean
  salary_min?: number
  salary_max?: number
  keywords?: string
}

export interface User {
  id: string
  email: string
  role: 'employer' | 'job_seeker'
  full_name: string
  avatar_url: string | null
  phone: string | null
  location: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  description: string | null
  website: string | null
  logo_url: string | null
  industry: string | null
  size: string | null
  location: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  name: string
  category: string | null
  created_at: string
}

export interface UserSkill {
  id: string
  user_id: string
  skill_id: string
  proficiency_level: number | null
  created_at: string
  skill?: Skill
}

export interface JobSkill {
  id: string
  job_id: string
  skill_id: string
  required: boolean
  created_at: string
  skill?: Skill
}

export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'interview'
  | 'interviewed'
  | 'offered'
  | 'hired'
  | 'accepted'
  | 'rejected'

export interface Application {
  id: string
  job_id: string
  applicant_id: string
  status: ApplicationStatus
  cover_letter: string | null
  resume_url: string | null
  notes: string | null
  applied_at: string
  updated_at: string
  job?: Job
  applicant?: User
}

export interface ApplicationWithDetails extends Application {
  job: Job
  applicant: User
}
