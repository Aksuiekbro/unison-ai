-- Adds optional job settings fields for compensation visibility, perks, publishing, and AI matching
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS hide_salary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS open_positions INTEGER DEFAULT 1 CHECK (open_positions >= 1),
  ADD COLUMN IF NOT EXISTS auto_close_on_hire BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_matching_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_notify_matches BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_min_match_score INTEGER DEFAULT 70 CHECK (ai_min_match_score BETWEEN 0 AND 100);
