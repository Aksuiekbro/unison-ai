-- Simplify database schema by adding profile fields directly to users table
-- This eliminates the need for a separate profiles table with overlapping data

-- Add LinkedIn, GitHub, and job title columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS current_job_title TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT;