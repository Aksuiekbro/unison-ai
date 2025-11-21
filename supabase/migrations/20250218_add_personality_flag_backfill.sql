-- Add personality assessment flag (if missing) and backfill from productivity flag
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS personality_assessment_completed BOOLEAN DEFAULT false;

UPDATE public.users
SET personality_assessment_completed = COALESCE(productivity_assessment_completed, false)
WHERE personality_assessment_completed IS NULL;
