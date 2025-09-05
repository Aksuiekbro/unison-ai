-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE user_role AS ENUM ('employer', 'job_seeker');
CREATE TYPE job_status AS ENUM ('draft', 'published', 'closed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'interview', 'accepted', 'rejected');
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship');
CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'executive');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    industry TEXT,
    size TEXT,
    location TEXT,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT companies_owner_is_employer CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = companies.owner_id 
            AND users.role = 'employer'
        )
    )
);

-- Skills table
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User skills junction table
CREATE TABLE public.user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, skill_id)
);

-- Jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_type job_type NOT NULL DEFAULT 'full_time',
    experience_level experience_level NOT NULL DEFAULT 'mid',
    salary_min INTEGER,
    salary_max INTEGER,
    currency TEXT DEFAULT 'USD',
    location TEXT,
    remote_allowed BOOLEAN DEFAULT FALSE,
    status job_status NOT NULL DEFAULT 'draft',
    posted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT jobs_employer_is_employer_role CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = jobs.employer_id 
            AND users.role = 'employer'
        )
    )
);

-- Job skills junction table
CREATE TABLE public.job_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, skill_id)
);

-- Applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'pending',
    cover_letter TEXT,
    resume_url TEXT,
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, applicant_id),
    
    CONSTRAINT applications_applicant_is_job_seeker CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = applications.applicant_id 
            AND users.role = 'job_seeker'
        )
    )
);

-- Database Performance Optimizations - Indexes for foreign keys and frequently queried fields

-- Users table indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_updated_at ON public.users(updated_at);
CREATE INDEX idx_users_location ON public.users(location);

-- Companies table indexes (foreign keys and frequently queried fields)
CREATE INDEX idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX idx_companies_created_at ON public.companies(created_at);
CREATE INDEX idx_companies_updated_at ON public.companies(updated_at);
CREATE INDEX idx_companies_industry ON public.companies(industry);
CREATE INDEX idx_companies_location ON public.companies(location);
CREATE INDEX idx_companies_name ON public.companies(name);

-- Jobs table indexes (foreign keys and frequently queried fields)
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX idx_jobs_experience_level ON public.jobs(experience_level);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_posted_at ON public.jobs(posted_at);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX idx_jobs_updated_at ON public.jobs(updated_at);
CREATE INDEX idx_jobs_expires_at ON public.jobs(expires_at);
CREATE INDEX idx_jobs_remote_allowed ON public.jobs(remote_allowed);
-- Composite indexes for common query patterns
CREATE INDEX idx_jobs_status_created_at ON public.jobs(status, created_at DESC);
CREATE INDEX idx_jobs_company_status ON public.jobs(company_id, status);

-- Applications table indexes (foreign keys and frequently queried fields)
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_applied_at ON public.applications(applied_at);
CREATE INDEX idx_applications_updated_at ON public.applications(updated_at);
-- Composite indexes for common query patterns
CREATE INDEX idx_applications_applicant_status ON public.applications(applicant_id, status);
CREATE INDEX idx_applications_job_status ON public.applications(job_id, status);

-- User skills table indexes (foreign keys)
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON public.user_skills(skill_id);
CREATE INDEX idx_user_skills_proficiency ON public.user_skills(proficiency_level);

-- Job skills table indexes (foreign keys)
CREATE INDEX idx_job_skills_job_id ON public.job_skills(job_id);
CREATE INDEX idx_job_skills_skill_id ON public.job_skills(skill_id);
CREATE INDEX idx_job_skills_required ON public.job_skills(required);

-- Skills table indexes
CREATE INDEX idx_skills_name ON public.skills(name);
CREATE INDEX idx_skills_category ON public.skills(category);

-- Database Triggers for Automatic Timestamp Updates

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON public.companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON public.jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON public.applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create role validation trigger functions
CREATE OR REPLACE FUNCTION validate_company_owner_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = NEW.owner_id 
        AND users.role = 'employer'
    ) THEN
        RAISE EXCEPTION 'Company owner must have employer role';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION validate_application_applicant_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = NEW.applicant_id 
        AND users.role = 'job_seeker'
    ) THEN
        RAISE EXCEPTION 'Application applicant must have job_seeker role';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply role validation triggers
CREATE TRIGGER validate_company_owner 
    BEFORE INSERT OR UPDATE ON public.companies 
    FOR EACH ROW EXECUTE FUNCTION validate_company_owner_role();

CREATE TRIGGER validate_application_applicant 
    BEFORE INSERT OR UPDATE ON public.applications 
    FOR EACH ROW EXECUTE FUNCTION validate_application_applicant_role();

-- Row Level Security Setup

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Public user data access for job applications and company profiles
CREATE POLICY "Anyone can view basic user info" ON public.users
    FOR SELECT USING (TRUE);

-- RLS Policies for companies table
CREATE POLICY "Employers can create companies" ON public.companies
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'employer')
    );

CREATE POLICY "Company owners can manage their companies" ON public.companies
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view companies" ON public.companies
    FOR SELECT USING (TRUE);

-- RLS Policies for skills table (global reference data)
CREATE POLICY "Anyone can view skills" ON public.skills
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create skills" ON public.skills
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for user_skills table
CREATE POLICY "Users can manage their own skills" ON public.user_skills
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view user skills" ON public.user_skills
    FOR SELECT USING (TRUE);

-- RLS Policies for jobs table
CREATE POLICY "Company owners can manage their jobs" ON public.jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = jobs.company_id 
            AND companies.owner_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view published jobs" ON public.jobs
    FOR SELECT USING (status = 'published');

CREATE POLICY "Company owners can view all their jobs regardless of status" ON public.jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = jobs.company_id 
            AND companies.owner_id = auth.uid()
        )
    );

-- RLS Policies for job_skills table
CREATE POLICY "Company owners can manage job skills" ON public.job_skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.jobs 
            JOIN public.companies ON companies.id = jobs.company_id
            WHERE jobs.id = job_skills.job_id 
            AND companies.owner_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view job skills for published jobs" ON public.job_skills
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs 
            WHERE jobs.id = job_skills.job_id 
            AND jobs.status = 'published'
        )
    );

-- RLS Policies for applications table
CREATE POLICY "Job seekers can create applications" ON public.applications
    FOR INSERT WITH CHECK (
        auth.uid() = applicant_id AND 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'job_seeker') AND
        EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND status = 'published')
    );

CREATE POLICY "Applicants can view their own applications" ON public.applications
    FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Applicants can update their own applications" ON public.applications
    FOR UPDATE USING (auth.uid() = applicant_id);

CREATE POLICY "Company owners can view applications to their jobs" ON public.applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            JOIN public.companies ON companies.id = jobs.company_id
            WHERE jobs.id = applications.job_id 
            AND companies.owner_id = auth.uid()
        )
    );

CREATE POLICY "Company owners can update applications to their jobs" ON public.applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            JOIN public.companies ON companies.id = jobs.company_id
            WHERE jobs.id = applications.job_id 
            AND companies.owner_id = auth.uid()
        )
    );