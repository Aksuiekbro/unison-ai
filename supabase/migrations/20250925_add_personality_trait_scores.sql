-- Add trait_scores JSONB column to personality_analysis for granular 1-100 trait evaluations
ALTER TABLE public.personality_analysis
  ADD COLUMN IF NOT EXISTS trait_scores JSONB;

-- Optional: create a GIN index for querying specific traits efficiently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_personality_trait_scores'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_personality_trait_scores ON public.personality_analysis USING GIN (trait_scores);
  END IF;
END $$;

