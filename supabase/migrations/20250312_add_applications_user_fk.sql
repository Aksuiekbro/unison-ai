-- Ensure applications.applicant_id correctly references public.users so PostgREST can join
-- This fixes runtime errors like:
-- "Could not find a relationship between 'applications' and 'users' in the schema cache"

-- 1) Make sure applicant_id exists and is populated
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS applicant_id uuid;

DO $$
BEGIN
  -- Backfill from legacy candidate_id column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'candidate_id'
  ) THEN
    UPDATE public.applications
    SET applicant_id = COALESCE(applicant_id, candidate_id)
    WHERE applicant_id IS NULL;
  END IF;
END $$;

-- Enforce NOT NULL once backfilled
ALTER TABLE public.applications
  ALTER COLUMN applicant_id SET NOT NULL;

-- 2) Recreate the FK to point at public.users (drop any old target such as public.profiles)
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_applicant_id_fkey;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_applicant_id_fkey
  FOREIGN KEY (applicant_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3) Keep supporting indexes/uniqueness used by the app
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'applications_job_applicant_unique'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_job_applicant_unique UNIQUE (job_id, applicant_id);
  END IF;
END $$;

-- 4) Validate RLS remains enabled
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
