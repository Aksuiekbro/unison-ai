export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'employer' | 'job_seeker'
          avatar_url: string | null
          phone: string | null
          location: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'employer' | 'job_seeker'
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'employer' | 'job_seeker'
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
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
        Insert: {
          id?: string
          name: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          industry?: string | null
          size?: string | null
          location?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          industry?: string | null
          size?: string | null
          location?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          created_at?: string
        }
      }
      user_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          proficiency_level: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          proficiency_level?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_id?: string
          proficiency_level?: number | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          requirements: string | null
          responsibilities: string | null
          company_id: string
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
        }
        Insert: {
          id?: string
          title: string
          description: string
          requirements?: string | null
          responsibilities?: string | null
          company_id: string
          job_type?: 'full_time' | 'part_time' | 'contract' | 'internship'
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          location?: string | null
          remote_allowed?: boolean
          status?: 'draft' | 'published' | 'closed' | 'cancelled'
          posted_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          requirements?: string | null
          responsibilities?: string | null
          company_id?: string
          job_type?: 'full_time' | 'part_time' | 'contract' | 'internship'
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          location?: string | null
          remote_allowed?: boolean
          status?: 'draft' | 'published' | 'closed' | 'cancelled'
          posted_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_skills: {
        Row: {
          id: string
          job_id: string
          skill_id: string
          required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          skill_id: string
          required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          skill_id?: string
          required?: boolean
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          applicant_id: string
          status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected'
          cover_letter: string | null
          resume_url: string | null
          notes: string | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          applicant_id: string
          status?: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected'
          cover_letter?: string | null
          resume_url?: string | null
          notes?: string | null
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          applicant_id?: string
          status?: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected'
          cover_letter?: string | null
          resume_url?: string | null
          notes?: string | null
          applied_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'employer' | 'job_seeker'
      job_status: 'draft' | 'published' | 'closed' | 'cancelled'
      application_status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected'
      job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
      experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
    }
  }
}