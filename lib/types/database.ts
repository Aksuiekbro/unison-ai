export type UserRole = 'employer' | 'job_seeker';
export type JobStatus = 'draft' | 'published' | 'closed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected';
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'executive';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          phone: string | null;
          location: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          location?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          location?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          website: string | null;
          logo_url: string | null;
          industry: string | null;
          size: string | null;
          location: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          industry?: string | null;
          size?: string | null;
          location?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          industry?: string | null;
          size?: string | null;
          location?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          created_at?: string;
        };
      };
      user_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          proficiency_level: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          proficiency_level?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          proficiency_level?: number | null;
          created_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          description: string;
          requirements: string | null;
          responsibilities: string | null;
          company_id: string;
          job_type: JobType;
          experience_level: ExperienceLevel;
          salary_min: number | null;
          salary_max: number | null;
          currency: string | null;
          location: string | null;
          remote_allowed: boolean | null;
          status: JobStatus;
          posted_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          requirements?: string | null;
          responsibilities?: string | null;
          company_id: string;
          job_type?: JobType;
          experience_level?: ExperienceLevel;
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string | null;
          location?: string | null;
          remote_allowed?: boolean | null;
          status?: JobStatus;
          posted_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          requirements?: string | null;
          responsibilities?: string | null;
          company_id?: string;
          job_type?: JobType;
          experience_level?: ExperienceLevel;
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string | null;
          location?: string | null;
          remote_allowed?: boolean | null;
          status?: JobStatus;
          posted_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_skills: {
        Row: {
          id: string;
          job_id: string;
          skill_id: string;
          required: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          skill_id: string;
          required?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          skill_id?: string;
          required?: boolean | null;
          created_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          status: ApplicationStatus;
          cover_letter: string | null;
          resume_url: string | null;
          notes: string | null;
          applied_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          applicant_id: string;
          status?: ApplicationStatus;
          cover_letter?: string | null;
          resume_url?: string | null;
          notes?: string | null;
          applied_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          applicant_id?: string;
          status?: ApplicationStatus;
          cover_letter?: string | null;
          resume_url?: string | null;
          notes?: string | null;
          applied_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      job_type: JobType;
      experience_level: ExperienceLevel;
    };
  };
}

// Convenience types for common operations
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export type Skill = Database['public']['Tables']['skills']['Row'];
export type SkillInsert = Database['public']['Tables']['skills']['Insert'];
export type SkillUpdate = Database['public']['Tables']['skills']['Update'];

export type UserSkill = Database['public']['Tables']['user_skills']['Row'];
export type UserSkillInsert = Database['public']['Tables']['user_skills']['Insert'];
export type UserSkillUpdate = Database['public']['Tables']['user_skills']['Update'];

export type Job = Database['public']['Tables']['jobs']['Row'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export type JobSkill = Database['public']['Tables']['job_skills']['Row'];
export type JobSkillInsert = Database['public']['Tables']['job_skills']['Insert'];
export type JobSkillUpdate = Database['public']['Tables']['job_skills']['Update'];

export type Application = Database['public']['Tables']['applications']['Row'];
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];

// Extended types with joined data
export type JobWithCompany = Job & {
  company: Company;
};

export type JobWithCompanyAndSkills = JobWithCompany & {
  job_skills: (JobSkill & { skill: Skill })[];
};

export type ApplicationWithJob = Application & {
  job: JobWithCompany;
};

export type ApplicationWithJobAndApplicant = Application & {
  job: JobWithCompany;
  applicant: User;
};

export type UserWithSkills = User & {
  user_skills: (UserSkill & { skill: Skill })[];
};

export type CompanyWithOwner = Company & {
  owner: User;
};