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

-- Saved jobs table (job seeker bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate_id ON public.saved_jobs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);

-- Profiles table (unified extended profile data for both job seekers and employers)
CREATE TABLE public.profiles (
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

-- Experience entries (for job seekers)
CREATE TABLE public.experiences (
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
CREATE TABLE public.educations (
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
CREATE TABLE public.questionnaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'open_ended' CHECK (question_type IN ('open_ended', 'multiple_choice', 'rating')),
    category TEXT, -- e.g., 'problem_solving', 'teamwork', 'leadership'
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test responses (user answers to personality questions)
CREATE TABLE public.test_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
    response_text TEXT,
    response_rating INTEGER CHECK (response_rating >= 1 AND response_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, question_id)
);

-- Personality analysis (AI-generated personality assessment)
CREATE TABLE public.personality_analysis (
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

-- Match scores (AI-generated candidate-job compatibility)
CREATE TABLE public.match_scores (
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
    
    UNIQUE(job_id, candidate_id),
    
    CONSTRAINT match_scores_candidate_is_job_seeker CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = match_scores.candidate_id 
            AND users.role = 'job_seeker'
        )
    )
);

-- Resume parsing results (AI-extracted data from resumes)
CREATE TABLE public.resume_parsing_results (
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

-- Applications table
CREATE TABLE public.applications (
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

-- Profiles table indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_personality_test_completed ON public.profiles(personality_test_completed);
CREATE INDEX idx_profiles_resume_parsed ON public.profiles(resume_parsed);
CREATE INDEX idx_profiles_ai_analysis_completed ON public.profiles(ai_analysis_completed);
CREATE INDEX idx_profiles_experience_years ON public.profiles(experience_years);
CREATE INDEX idx_profiles_preferred_location ON public.profiles(preferred_location);

-- Experiences table indexes
CREATE INDEX idx_experiences_profile_id ON public.experiences(profile_id);
CREATE INDEX idx_experiences_is_current ON public.experiences(is_current);
CREATE INDEX idx_experiences_start_date ON public.experiences(start_date);

-- Educations table indexes
CREATE INDEX idx_educations_profile_id ON public.educations(profile_id);
CREATE INDEX idx_educations_is_current ON public.educations(is_current);
CREATE INDEX idx_educations_start_date ON public.educations(start_date);

-- Questionnaires table indexes
CREATE INDEX idx_questionnaires_is_active ON public.questionnaires(is_active);
CREATE INDEX idx_questionnaires_category ON public.questionnaires(category);
CREATE INDEX idx_questionnaires_order_index ON public.questionnaires(order_index);

-- Test responses table indexes
CREATE INDEX idx_test_responses_user_id ON public.test_responses(user_id);
CREATE INDEX idx_test_responses_question_id ON public.test_responses(question_id);
CREATE INDEX idx_test_responses_created_at ON public.test_responses(created_at);

-- Personality analysis table indexes
CREATE INDEX idx_personality_analysis_user_id ON public.personality_analysis(user_id);
CREATE INDEX idx_personality_analysis_created_at ON public.personality_analysis(created_at);

-- Match scores table indexes
CREATE INDEX idx_match_scores_job_id ON public.match_scores(job_id);
CREATE INDEX idx_match_scores_candidate_id ON public.match_scores(candidate_id);
CREATE INDEX idx_match_scores_overall_score ON public.match_scores(overall_score DESC);
CREATE INDEX idx_match_scores_created_at ON public.match_scores(created_at);
-- Composite indexes for common query patterns
CREATE INDEX idx_match_scores_job_score ON public.match_scores(job_id, overall_score DESC);
CREATE INDEX idx_match_scores_candidate_score ON public.match_scores(candidate_id, overall_score DESC);

-- Resume parsing results table indexes
CREATE INDEX idx_resume_parsing_user_id ON public.resume_parsing_results(user_id);
CREATE INDEX idx_resume_parsing_success ON public.resume_parsing_results(parsing_success);
CREATE INDEX idx_resume_parsing_created_at ON public.resume_parsing_results(created_at);

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

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_analysis_updated_at 
    BEFORE UPDATE ON public.personality_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_scores_updated_at 
    BEFORE UPDATE ON public.match_scores 
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

-- RLS Policies for profiles table
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = profiles.user_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Employers can view job seeker profiles for their applications" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = profiles.user_id 
            AND users.role = 'job_seeker'
        ) AND EXISTS (
            SELECT 1 FROM public.applications
            JOIN public.jobs ON jobs.id = applications.job_id
            JOIN public.companies ON companies.id = jobs.company_id
            WHERE applications.applicant_id = profiles.user_id
            AND companies.owner_id = auth.uid()
        )
    );

-- RLS Policies for experiences table
CREATE POLICY "Users can manage their own experiences" ON public.experiences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            JOIN public.users ON users.id = profiles.user_id
            WHERE profiles.id = experiences.profile_id 
            AND users.id = auth.uid()
        )
    );

-- RLS Policies for educations table  
CREATE POLICY "Users can manage their own education" ON public.educations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            JOIN public.users ON users.id = profiles.user_id
            WHERE profiles.id = educations.profile_id 
            AND users.id = auth.uid()
        )
    );

-- RLS Policies for questionnaires table (global read access)
CREATE POLICY "Anyone can view active questionnaires" ON public.questionnaires
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can create questionnaires" ON public.questionnaires
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for test_responses table
CREATE POLICY "Users can manage their own test responses" ON public.test_responses
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for personality_analysis table
CREATE POLICY "Users can view their own personality analysis" ON public.personality_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create personality analysis" ON public.personality_analysis
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "System can update personality analysis" ON public.personality_analysis
    FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "Employers can view personality analysis for their applications" ON public.personality_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.applications
            JOIN public.jobs ON jobs.id = applications.job_id
            JOIN public.companies ON companies.id = jobs.company_id
            WHERE applications.applicant_id = personality_analysis.user_id
            AND companies.owner_id = auth.uid()
        )
    );

-- RLS Policies for match_scores table
CREATE POLICY "Candidates can view their own match scores" ON public.match_scores
    FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "Company owners can view match scores for their jobs" ON public.match_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            JOIN public.companies ON companies.id = jobs.company_id
            WHERE jobs.id = match_scores.job_id 
            AND companies.owner_id = auth.uid()
        )
    );

CREATE POLICY "System can manage match scores" ON public.match_scores
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for resume_parsing_results table  
CREATE POLICY "Users can manage their own resume parsing results" ON public.resume_parsing_results
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "System can create resume parsing results" ON public.resume_parsing_results
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "System can update resume parsing results" ON public.resume_parsing_results
    FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = user_id);