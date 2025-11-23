-- Ensure user contact/profile links are available on public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS current_job_title TEXT,
  ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Remove legacy normalized profile tables now superseded by JSON fields on users
DROP TABLE IF EXISTS public.experiences CASCADE;
DROP TABLE IF EXISTS public.educations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
