-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types (skip if they already exist)
-- CREATE TYPE user_role AS ENUM ('employer', 'job_seeker');
-- CREATE TYPE job_status AS ENUM ('draft', 'published', 'closed', 'cancelled');
-- CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'interview', 'accepted', 'rejected');
-- CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship');
-- CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'executive');

-- Safe type creation with error handling
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('employer', 'job_seeker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('draft', 'published', 'closed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'interview', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'executive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
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
CREATE TABLE IF NOT EXISTS public.companies (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User skills junction table
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, skill_id)
);

-- Safe backfill: ensure user_id exists on user_skills for pre-existing databases
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_skills' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.user_skills ADD COLUMN user_id UUID;
        BEGIN
            ALTER TABLE public.user_skills ADD CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe backfill: ensure employer_id exists on jobs for pre-existing databases
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'employer_id'
    ) THEN
        ALTER TABLE public.jobs ADD COLUMN employer_id UUID;
        ALTER TABLE public.jobs ADD CONSTRAINT jobs_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Job skills junction table
CREATE TABLE IF NOT EXISTS public.job_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, skill_id)
);

-- Profiles table (unified extended profile data for both job seekers and employers)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Job seeker specific fields
    experience_years INTEGER,
    current_job_title TEXT,
    desired_salary_min INTEGER,
    desired_salary_max INTEGER,
    preferred_location TEXT,
    remote_preference BOOLEAN,
    resume_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    
    -- Employer specific fields  
    company_culture TEXT,
    hiring_preferences TEXT,
    
    -- AI analysis flags
    personality_test_completed BOOLEAN DEFAULT FALSE,
    resume_parsed BOOLEAN DEFAULT FALSE,
    ai_analysis_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Safe backfill: ensure user_id exists on profiles for pre-existing databases
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_id UUID;
        BEGIN
            ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Experience entries (for job seekers)
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    achievements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Education entries (for job seekers)
CREATE TABLE IF NOT EXISTS public.educations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    institution_name TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    gpa TEXT,
    achievements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questionnaires table (personality test questions)
CREATE TABLE IF NOT EXISTS public.questionnaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'open_ended' CHECK (question_type IN ('open_ended', 'multiple_choice', 'rating')),
    category TEXT, -- e.g., 'problem_solving', 'teamwork', 'leadership'
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test responses (user answers to personality questions)
CREATE TABLE IF NOT EXISTS public.test_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL, -- String ID instead of UUID reference for flexibility
    response_text TEXT,
    response_rating INTEGER CHECK (response_rating >= 1 AND response_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, question_id)
);

-- Safe backfill: ensure user_id exists on test_responses for pre-existing databases
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'test_responses' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.test_responses ADD COLUMN user_id UUID;
        BEGIN
            ALTER TABLE public.test_responses ADD CONSTRAINT test_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Personality analysis (AI-generated personality assessment)
CREATE TABLE IF NOT EXISTS public.personality_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- AI analysis results
    problem_solving_style TEXT,
    initiative_level TEXT,
    work_preference TEXT,
    motivational_factors TEXT,
    growth_areas TEXT,
    communication_style TEXT,
    leadership_potential TEXT,
    
    -- Overall scores (0-100)
    analytical_score INTEGER CHECK (analytical_score >= 0 AND analytical_score <= 100),
    creative_score INTEGER CHECK (creative_score >= 0 AND creative_score <= 100),
    leadership_score INTEGER CHECK (leadership_score >= 0 AND leadership_score <= 100),
    teamwork_score INTEGER CHECK (teamwork_score >= 0 AND teamwork_score <= 100),
    
    -- AI metadata
    ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    analysis_version TEXT DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Safe backfill: ensure user_id exists on personality_analysis for pre-existing databases
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'personality_analysis' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.personality_analysis ADD COLUMN user_id UUID;
        BEGIN
            ALTER TABLE public.personality_analysis ADD CONSTRAINT personality_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Match scores (AI-generated candidate-job compatibility)
CREATE TABLE IF NOT EXISTS public.match_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Overall match score (0-100)
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- Component scores
    skills_match_score INTEGER CHECK (skills_match_score >= 0 AND skills_match_score <= 100),
    experience_match_score INTEGER CHECK (experience_match_score >= 0 AND experience_match_score <= 100),
    culture_fit_score INTEGER CHECK (culture_fit_score >= 0 AND culture_fit_score <= 100),
    personality_match_score INTEGER CHECK (personality_match_score >= 0 AND personality_match_score <= 100),
    
    -- AI explanation
    match_explanation TEXT,
    strengths TEXT,
    potential_concerns TEXT,
    
    -- AI metadata
    ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    analysis_version TEXT DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, candidate_id)
);

-- Resume parsing results (AI-extracted data from resumes)
CREATE TABLE IF NOT EXISTS public.resume_parsing_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Original file info
    original_filename TEXT,
    file_url TEXT,
    file_type TEXT,
    
    -- AI extracted data (JSON format)
    extracted_data JSONB,
    
    -- Extraction metadata
    parsing_success BOOLEAN DEFAULT FALSE,
    parsing_errors TEXT,
    ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    processing_time_seconds INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Safe backfill: ensure user_id exists on resume_parsing_results for pre-existing databases
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'resume_parsing_results' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.resume_parsing_results ADD COLUMN user_id UUID;
        BEGIN
            ALTER TABLE public.resume_parsing_results ADD CONSTRAINT resume_parsing_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'pending',
    cover_letter TEXT,
    resume_url TEXT,
    notes TEXT,
    
    -- AI-enhanced fields
    match_score_id UUID REFERENCES public.match_scores(id),
    
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, applicant_id)
);

-- Database Performance Optimizations - Indexes for foreign keys and frequently queried fields

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at);
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(location);

-- Companies table indexes (foreign keys and frequently queried fields)
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON public.companies(updated_at);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_location ON public.companies(location);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

-- Jobs table indexes (foreign keys and frequently queried fields)
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON public.jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON public.jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON public.jobs(updated_at);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON public.jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_allowed ON public.jobs(remote_allowed);
-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON public.jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company_status ON public.jobs(company_id, status);

-- Applications table indexes (foreign keys and frequently queried fields)
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON public.applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON public.applications(updated_at);
-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_applications_applicant_status ON public.applications(applicant_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON public.applications(job_id, status);

-- User skills table indexes (foreign keys)
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON public.user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_proficiency ON public.user_skills(proficiency_level);

-- Job skills table indexes (foreign keys)
CREATE INDEX IF NOT EXISTS idx_job_skills_job_id ON public.job_skills(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill_id ON public.job_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_required ON public.job_skills(required);

-- Skills table indexes
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_personality_test_completed ON public.profiles(personality_test_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_resume_parsed ON public.profiles(resume_parsed);
CREATE INDEX IF NOT EXISTS idx_profiles_ai_analysis_completed ON public.profiles(ai_analysis_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_experience_years ON public.profiles(experience_years);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_location ON public.profiles(preferred_location);

-- Other table indexes
CREATE INDEX IF NOT EXISTS idx_experiences_profile_id ON public.experiences(profile_id);
CREATE INDEX IF NOT EXISTS idx_experiences_is_current ON public.experiences(is_current);
CREATE INDEX IF NOT EXISTS idx_experiences_start_date ON public.experiences(start_date);

CREATE INDEX IF NOT EXISTS idx_educations_profile_id ON public.educations(profile_id);
CREATE INDEX IF NOT EXISTS idx_educations_is_current ON public.educations(is_current);
CREATE INDEX IF NOT EXISTS idx_educations_start_date ON public.educations(start_date);

CREATE INDEX IF NOT EXISTS idx_questionnaires_is_active ON public.questionnaires(is_active);
CREATE INDEX IF NOT EXISTS idx_questionnaires_category ON public.questionnaires(category);
CREATE INDEX IF NOT EXISTS idx_questionnaires_order_index ON public.questionnaires(order_index);

CREATE INDEX IF NOT EXISTS idx_test_responses_user_id ON public.test_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_test_responses_question_id ON public.test_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_test_responses_created_at ON public.test_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_personality_analysis_user_id ON public.personality_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_analysis_created_at ON public.personality_analysis(created_at);

CREATE INDEX IF NOT EXISTS idx_match_scores_job_id ON public.match_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_candidate_id ON public.match_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_overall_score ON public.match_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_scores_created_at ON public.match_scores(created_at);
-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_match_scores_job_score ON public.match_scores(job_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_scores_candidate_score ON public.match_scores(candidate_id, overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_resume_parsing_user_id ON public.resume_parsing_results(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_parsing_success ON public.resume_parsing_results(parsing_success);
CREATE INDEX IF NOT EXISTS idx_resume_parsing_created_at ON public.resume_parsing_results(created_at);

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
DO $$ BEGIN
    CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON public.users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_companies_updated_at 
        BEFORE UPDATE ON public.companies 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_jobs_updated_at 
        BEFORE UPDATE ON public.jobs 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_applications_updated_at 
        BEFORE UPDATE ON public.applications 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_profiles_updated_at 
        BEFORE UPDATE ON public.profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_personality_analysis_updated_at 
        BEFORE UPDATE ON public.personality_analysis 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_match_scores_updated_at 
        BEFORE UPDATE ON public.match_scores 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

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

CREATE OR REPLACE FUNCTION validate_job_employer_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = NEW.employer_id 
        AND users.role = 'employer'
    ) THEN
        RAISE EXCEPTION 'Job employer must have employer role';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION validate_match_candidate_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = NEW.candidate_id 
        AND users.role = 'job_seeker'
    ) THEN
        RAISE EXCEPTION 'Match candidate must have job_seeker role';
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

-- Apply role validation triggers (safe creation)
DO $$ BEGIN
    CREATE TRIGGER validate_company_owner 
        BEFORE INSERT OR UPDATE ON public.companies 
        FOR EACH ROW EXECUTE FUNCTION validate_company_owner_role();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER validate_job_employer 
        BEFORE INSERT OR UPDATE ON public.jobs 
        FOR EACH ROW EXECUTE FUNCTION validate_job_employer_role();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER validate_match_candidate 
        BEFORE INSERT OR UPDATE ON public.match_scores 
        FOR EACH ROW EXECUTE FUNCTION validate_match_candidate_role();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER validate_application_applicant 
        BEFORE INSERT OR UPDATE ON public.applications 
        FOR EACH ROW EXECUTE FUNCTION validate_application_applicant_role();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Row Level Security Setup

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on AI-related tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_parsing_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DO $$ BEGIN
    CREATE POLICY "Users can view their own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own profile" ON public.users
        FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Public user data access for job applications and company profiles
DO $$ BEGIN
    CREATE POLICY "Anyone can view basic user info" ON public.users
        FOR SELECT USING (TRUE);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for companies table
DO $$ BEGIN
    CREATE POLICY "Employers can create companies" ON public.companies
        FOR INSERT WITH CHECK (
            auth.uid() = owner_id AND 
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'employer')
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Company owners can manage their companies" ON public.companies
        FOR ALL USING (auth.uid() = owner_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Anyone can view companies" ON public.companies
        FOR SELECT USING (TRUE);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for skills table (global reference data)
DO $$ BEGIN
    CREATE POLICY "Anyone can view skills" ON public.skills
        FOR SELECT USING (TRUE);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can create skills" ON public.skills
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add more RLS policies here following the same pattern...
-- (Continuing with the rest of the policies from the original file)