-- Drop ai_summaries table if it exists
DROP TABLE IF EXISTS ai_summaries;

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

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.job_skills CASCADE;
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Unified profiles table (consolidates all user profile data)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    role user_role NOT NULL,
    phone TEXT,
    location TEXT,
    bio TEXT,
    avatar_url TEXT,
    skills TEXT[], -- Array of skill names for simplified storage
    experience_level experience_level,
    resume_url TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    salary_expectations_min INTEGER,
    salary_expectations_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    availability_status TEXT, -- 'available', 'employed_open', 'employed_not_looking'
    preferred_job_types job_type[],
    preferred_locations TEXT[],
    remote_preference BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT profiles_name_not_empty CHECK (
        LENGTH(TRIM(first_name)) > 0 AND LENGTH(TRIM(last_name)) > 0
    ),
    CONSTRAINT profiles_salary_range CHECK (
        salary_expectations_min IS NULL OR salary_expectations_max IS NULL OR 
        salary_expectations_min <= salary_expectations_max
    ),
    CONSTRAINT profiles_phone_format CHECK (
        phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'
    )
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
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger function to validate owner is employer
CREATE OR REPLACE FUNCTION validate_company_owner_is_employer()
RETURNS TRIGGER AS $$
DECLARE
    owner_role user_role;
BEGIN
    -- Get the role of the owner_id
    SELECT role INTO owner_role
    FROM public.profiles
    WHERE id = NEW.owner_id;
    
    -- If no profile found or role is not employer, raise error
    IF owner_role IS NULL THEN
        RAISE EXCEPTION 'Owner profile not found for owner_id: %', NEW.owner_id;
    END IF;
    
    IF owner_role != 'employer' THEN
        RAISE EXCEPTION 'Only users with employer role can own companies. Current role: %', owner_role;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on companies table
CREATE TRIGGER companies_validate_owner_is_employer
    BEFORE INSERT OR UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION validate_company_owner_is_employer();

-- Skills table (for skill reference and categorization)
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    job_type job_type NOT NULL DEFAULT 'full_time',
    experience_level experience_level NOT NULL DEFAULT 'mid',
    salary_min INTEGER,
    salary_max INTEGER,
    currency TEXT DEFAULT 'USD',
    location TEXT,
    remote_allowed BOOLEAN DEFAULT FALSE,
    required_skills TEXT[], -- Array of required skill names
    preferred_skills TEXT[], -- Array of preferred skill names
    status job_status NOT NULL DEFAULT 'draft',
    posted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT jobs_salary_range CHECK (
        salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max
    )
);

-- Applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'pending',
    cover_letter TEXT,
    resume_url TEXT,
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, applicant_id)
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_location ON public.profiles(location);
CREATE INDEX idx_profiles_experience_level ON public.profiles(experience_level);
CREATE INDEX idx_profiles_skills ON public.profiles USING GIN(skills);
CREATE INDEX idx_profiles_preferred_job_types ON public.profiles USING GIN(preferred_job_types);
CREATE INDEX idx_profiles_preferred_locations ON public.profiles USING GIN(preferred_locations);
CREATE INDEX idx_profiles_full_name ON public.profiles(full_name);

CREATE INDEX idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX idx_companies_industry ON public.companies(industry);
CREATE INDEX idx_companies_location ON public.companies(location);

CREATE INDEX idx_skills_name ON public.skills(name);
CREATE INDEX idx_skills_category ON public.skills(category);

CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX idx_jobs_experience_level ON public.jobs(experience_level);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_posted_at ON public.jobs(posted_at);
CREATE INDEX idx_jobs_required_skills ON public.jobs USING GIN(required_skills);
CREATE INDEX idx_jobs_preferred_skills ON public.jobs USING GIN(preferred_skills);
CREATE INDEX idx_jobs_salary_range ON public.jobs(salary_min, salary_max);

CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_applied_at ON public.applications(applied_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
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

-- Trigger function to validate company owner has employer role
CREATE OR REPLACE FUNCTION validate_company_owner_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the owner_id has 'employer' role in profiles table
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.owner_id 
        AND role = 'employer'
    ) THEN
        RAISE EXCEPTION 'User with ID % must have employer role to create or update a company', NEW.owner_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger function to validate application applicant has job_seeker role
CREATE OR REPLACE FUNCTION validate_application_applicant_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the applicant_id has 'job_seeker' role in profiles table
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.applicant_id 
        AND role = 'job_seeker'
    ) THEN
        RAISE EXCEPTION 'User with ID % must have job_seeker role to create or update an application', NEW.applicant_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger function to validate applicant job seeker role
CREATE OR REPLACE FUNCTION validate_applicant_job_seeker_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = NEW.applicant_id
        AND profiles.role = 'job_seeker'
    ) THEN
        RAISE EXCEPTION 'Applicant must have job_seeker role';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply role validation triggers
CREATE TRIGGER validate_company_owner_role_trigger
    BEFORE INSERT OR UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION validate_company_owner_role();

CREATE TRIGGER validate_application_applicant_role_trigger
    BEFORE INSERT OR UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION validate_application_applicant_role();

-- Trigger to validate applicant role before insert and update
CREATE TRIGGER validate_applicant_job_seeker_before_insert_update
    BEFORE INSERT OR UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION validate_applicant_job_seeker_role();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Employers can view job seeker profiles" ON public.profiles
    FOR SELECT USING (
        role = 'job_seeker' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'employer'
        )
    );

CREATE POLICY "Job seekers can view employer profiles" ON public.profiles
    FOR SELECT USING (
        role = 'employer' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'job_seeker'
        )
    );

-- RLS Policies for companies table
CREATE POLICY "Employers can create companies" ON public.companies
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'employer')
    );

CREATE POLICY "Company owners can manage their companies" ON public.companies
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view companies" ON public.companies
    FOR SELECT USING (TRUE);

-- RLS Policies for skills table
CREATE POLICY "Anyone can view skills" ON public.skills
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create skills" ON public.skills
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

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

CREATE POLICY "Company owners can view all their jobs" ON public.jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = jobs.company_id 
            AND companies.owner_id = auth.uid()
        )
    );

-- RLS Policies for applications table
CREATE POLICY "Job seekers can create applications" ON public.applications
    FOR INSERT WITH CHECK (
        auth.uid() = applicant_id AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'job_seeker')
    );

CREATE POLICY "Applicants can view their own applications" ON public.applications
    FOR SELECT USING (auth.uid() = applicant_id);

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

CREATE POLICY "Applicants can update their own applications" ON public.applications
    FOR UPDATE USING (auth.uid() = applicant_id);