-- Add missing profile/contact fields to users table used by the app
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS current_job_title TEXT,
  ADD COLUMN IF NOT EXISTS resume_url TEXT;
