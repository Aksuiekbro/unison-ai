-- Add the missing match_score_id column to applications so API selects can join match_scores
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS match_score_id uuid REFERENCES public.match_scores(id);

-- Helpful index for lookups by match_score_id if present
CREATE INDEX IF NOT EXISTS idx_applications_match_score_id
  ON public.applications(match_score_id);
