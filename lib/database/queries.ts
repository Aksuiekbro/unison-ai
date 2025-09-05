import { supabase } from '../supabase-client';
import { 
  User, UserInsert, UserUpdate,
  Company, CompanyInsert, CompanyUpdate,
  Job, JobInsert, JobUpdate,
  Application, ApplicationInsert, ApplicationUpdate,
  Skill, SkillInsert,
  UserSkill, UserSkillInsert,
  JobSkill, JobSkillInsert,
  JobWithCompanyAndSkills,
  ApplicationWithJobAndApplicant,
  UserWithSkills
} from '../types/database';

// User queries
export const userQueries = {
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(user: UserInsert): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getWithSkills(id: string): Promise<UserWithSkills | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_skills(
          *,
          skill:skills(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// Company queries
export const companyQueries = {
  async getById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getByOwner(ownerId: string): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(company: CompanyInsert): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: CompanyUpdate): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Job queries
export const jobQueries = {
  async getById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getPublished(filters?: {
    location?: string;
    jobType?: string;
    experienceLevel?: string;
    skillIds?: string[];
    limit?: number;
    offset?: number;
  }): Promise<JobWithCompanyAndSkills[]> {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        company:companies(*),
        job_skills(
          *,
          skill:skills(*)
        )
      `)
      .eq('status', 'published');

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters?.jobType) {
      query = query.eq('job_type', filters.jobType);
    }
    if (filters?.experienceLevel) {
      query = query.eq('experience_level', filters.experienceLevel);
    }
    if (filters?.skillIds && filters.skillIds.length > 0) {
      query = query.overlaps('job_skills.skill_id', filters.skillIds);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1);
    }

    query = query.order('posted_at', { ascending: false });

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  async getByCompany(companyId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(job: JobInsert): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert(job)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: JobUpdate): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Application queries
export const applicationQueries = {
  async getById(id: string): Promise<Application | null> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getByApplicant(applicantId: string): Promise<ApplicationWithJobAndApplicant[]> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(
          *,
          company:companies(*)
        ),
        applicant:users(*)
      `)
      .eq('applicant_id', applicantId)
      .order('applied_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByJob(jobId: string): Promise<ApplicationWithJobAndApplicant[]> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(
          *,
          company:companies(*)
        ),
        applicant:users(*)
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByCompany(companyId: string): Promise<ApplicationWithJobAndApplicant[]> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs!inner(
          *,
          company:companies!inner(*)
        ),
        applicant:users(*)
      `)
      .eq('job.company.id', companyId)
      .order('applied_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(application: ApplicationInsert): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: ApplicationUpdate): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Skill queries
export const skillQueries = {
  async getAll(): Promise<Skill[]> {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async search(query: string): Promise<Skill[]> {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(10);
    
    if (error) throw error;
    return data || [];
  },

  async create(skill: SkillInsert): Promise<Skill> {
    const { data, error } = await supabase
      .from('skills')
      .insert(skill)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByIds(ids: string[]): Promise<Skill[]> {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .in('id', ids);
    
    if (error) throw error;
    return data || [];
  }
};

// User skill queries
export const userSkillQueries = {
  async addSkillToUser(userSkill: UserSkillInsert): Promise<UserSkill> {
    const { data, error } = await supabase
      .from('user_skills')
      .insert(userSkill)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeSkillFromUser(userId: string, skillId: string): Promise<void> {
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId)
      .eq('skill_id', skillId);
    
    if (error) throw error;
  },

  async updateProficiency(userId: string, skillId: string, proficiencyLevel: number): Promise<UserSkill> {
    const { data, error } = await supabase
      .from('user_skills')
      .update({ proficiency_level: proficiencyLevel })
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Job skill queries
export const jobSkillQueries = {
  async addSkillToJob(jobSkill: JobSkillInsert): Promise<JobSkill> {
    const { data, error } = await supabase
      .from('job_skills')
      .insert(jobSkill)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeSkillFromJob(jobId: string, skillId: string): Promise<void> {
    const { error } = await supabase
      .from('job_skills')
      .delete()
      .eq('job_id', jobId)
      .eq('skill_id', skillId);
    
    if (error) throw error;
  },

  async updateRequirement(jobId: string, skillId: string, required: boolean): Promise<JobSkill> {
    const { data, error } = await supabase
      .from('job_skills')
      .update({ required })
      .eq('job_id', jobId)
      .eq('skill_id', skillId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};