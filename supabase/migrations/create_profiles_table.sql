-- Complete migration to single-table architecture
-- This eliminates the need for separate profiles, experiences, and educations tables

-- First, add the new columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS current_job_title TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS educations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS company_culture TEXT,
ADD COLUMN IF NOT EXISTS hiring_preferences TEXT;

-- Migrate existing data safely (if profiles table exists)
DO $$
DECLARE
    has_linkedin_url BOOLEAN;
    has_github_url BOOLEAN; 
    has_current_job_title BOOLEAN;
    has_portfolio_url BOOLEAN;
    has_resume_url BOOLEAN;
    has_company_culture BOOLEAN;
    has_hiring_preferences BOOLEAN;
BEGIN
  -- Check if profiles table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    
    -- Check which columns exist in profiles table
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'linkedin_url') INTO has_linkedin_url;
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'github_url') INTO has_github_url;
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'current_job_title') INTO has_current_job_title;
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'portfolio_url') INTO has_portfolio_url;
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'resume_url') INTO has_resume_url;
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'company_culture') INTO has_company_culture;
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hiring_preferences') INTO has_hiring_preferences;
    
    -- Migrate only existing columns
    IF has_linkedin_url THEN
      EXECUTE 'UPDATE public.users SET linkedin_url = COALESCE(users.linkedin_url, profiles.linkedin_url) FROM public.profiles WHERE users.id = profiles.user_id AND profiles.linkedin_url IS NOT NULL';
    END IF;
    
    IF has_github_url THEN
      EXECUTE 'UPDATE public.users SET github_url = COALESCE(users.github_url, profiles.github_url) FROM public.profiles WHERE users.id = profiles.user_id AND profiles.github_url IS NOT NULL';
    END IF;
    
    IF has_current_job_title THEN
      EXECUTE 'UPDATE public.users SET current_job_title = COALESCE(users.current_job_title, profiles.current_job_title) FROM public.profiles WHERE users.id = profiles.user_id AND profiles.current_job_title IS NOT NULL';
    END IF;
    
    IF has_portfolio_url THEN
      EXECUTE 'UPDATE public.users SET portfolio_url = COALESCE(users.portfolio_url, profiles.portfolio_url) FROM public.profiles WHERE users.id = profiles.user_id AND profiles.portfolio_url IS NOT NULL';
    END IF;
    
    IF has_resume_url THEN
      EXECUTE 'UPDATE public.users SET resume_url = COALESCE(users.resume_url, profiles.resume_url) FROM public.profiles WHERE users.id = profiles.user_id AND profiles.resume_url IS NOT NULL';
    END IF;
    
    IF has_company_culture THEN
      EXECUTE 'UPDATE public.users SET company_culture = COALESCE(users.company_culture, profiles.company_culture) FROM public.profiles WHERE users.id = profiles.user_id AND profiles.company_culture IS NOT NULL';
    END IF;
    
    IF has_hiring_preferences THEN
      EXECUTE 'UPDATE public.users SET hiring_preferences = COALESCE(users.hiring_preferences, profiles.hiring_preferences) FROM public.profiles WHERE users.id = profiles.user_id AND profiles.hiring_preferences IS NOT NULL';
    END IF;
    
    -- Migrate experiences to JSON format (if experiences table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'experiences') THEN
      UPDATE public.users SET
        experiences = COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', exp.id::text,
              'position', exp.job_title,
              'company', exp.company_name,
              'startDate', exp.start_date::text,
              'endDate', exp.end_date::text,
              'description', exp.description,
              'isCurrent', exp.is_current
            )
          )
          FROM public.experiences exp 
          JOIN public.profiles p ON p.id = exp.profile_id
          WHERE p.user_id = users.id),
          '[]'::jsonb
        )
      WHERE role = 'job_seeker' AND users.experiences IS NULL;
    END IF;
    
    -- Migrate educations to JSON format (if educations table exists)  
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'educations') THEN
      UPDATE public.users SET
        educations = COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', edu.id::text,
              'institution', edu.institution_name,
              'degree', edu.degree,
              'fieldOfStudy', edu.field_of_study,
              'graduationYear', EXTRACT(YEAR FROM edu.end_date)::integer
            )
          )
          FROM public.educations edu
          JOIN public.profiles p ON p.id = edu.profile_id  
          WHERE p.user_id = users.id),
          '[]'::jsonb
        )
      WHERE role = 'job_seeker' AND users.educations IS NULL;
    END IF;
    
  END IF; -- End of profiles table exists check
END $$;

-- Drop the problematic tables after migration (only if they exist)
DROP TABLE IF EXISTS public.experiences CASCADE;
DROP TABLE IF EXISTS public.educations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;