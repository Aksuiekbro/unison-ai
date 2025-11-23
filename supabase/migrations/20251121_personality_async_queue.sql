-- Add status tracking for personality analysis to support async processing
ALTER TABLE public.personality_analysis
    ADD COLUMN status TEXT,
    ADD COLUMN queued_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN error_message TEXT;

-- Backfill existing rows as completed analyses
UPDATE public.personality_analysis
SET
    status = 'completed',
    queued_at = COALESCE(created_at, NOW()),
    processed_at = COALESCE(updated_at, created_at)
WHERE status IS NULL;

-- Enforce defaults and constraints after backfill
ALTER TABLE public.personality_analysis
    ALTER COLUMN status SET DEFAULT 'queued',
    ALTER COLUMN queued_at SET DEFAULT NOW();

ALTER TABLE public.personality_analysis
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.personality_analysis
    ADD CONSTRAINT personality_analysis_status_check
        CHECK (status IN ('queued', 'processing', 'completed', 'failed'));
