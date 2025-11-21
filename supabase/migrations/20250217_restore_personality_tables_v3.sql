-- Restore personality_analysis and test_responses if previous migration dropped them

-- personality_analysis
CREATE TABLE IF NOT EXISTS public.personality_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  problem_solving_style text,
  initiative_level text,
  work_preference text,
  motivational_factors text,
  growth_areas text,
  communication_style text,
  leadership_potential text,
  analytical_score integer,
  creative_score integer,
  leadership_score integer,
  teamwork_score integer,
  trait_scores jsonb,
  ai_confidence_score numeric,
  analysis_version text,
  status text DEFAULT 'queued' NOT NULL,
  queued_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure required columns exist
ALTER TABLE public.personality_analysis
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'queued' NOT NULL,
  ADD COLUMN IF NOT EXISTS queued_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS analysis_version text;

-- Status constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'personality_analysis_status_check') THEN
    ALTER TABLE public.personality_analysis
      ADD CONSTRAINT personality_analysis_status_check CHECK (status IN ('queued','processing','completed','failed'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_personality_analysis_user_id ON public.personality_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_analysis_created_at ON public.personality_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_personality_trait_scores ON public.personality_analysis USING GIN (trait_scores);

-- RLS
ALTER TABLE public.personality_analysis ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='personality_analysis' AND policyname='Users can view their own personality analysis'
  ) THEN
    CREATE POLICY "Users can view their own personality analysis" ON public.personality_analysis
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='personality_analysis' AND policyname='System can create personality analysis'
  ) THEN
    CREATE POLICY "System can create personality analysis" ON public.personality_analysis
      FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='personality_analysis' AND policyname='System can update personality analysis'
  ) THEN
    CREATE POLICY "System can update personality analysis" ON public.personality_analysis
      FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='personality_analysis' AND policyname='Employers can view personality analysis for their applications'
  ) THEN
    CREATE POLICY "Employers can view personality analysis for their applications" ON public.personality_analysis
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.applications
          JOIN public.jobs ON jobs.id = applications.job_id
          JOIN public.companies ON companies.id = jobs.company_id
          WHERE applications.applicant_id = personality_analysis.user_id
            AND companies.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- test_responses
CREATE TABLE IF NOT EXISTS public.test_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  response_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.test_responses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='test_responses' AND policyname='Users can manage their own test responses'
  ) THEN
    CREATE POLICY "Users can manage their own test responses" ON public.test_responses
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_personality_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_personality_analysis_updated_at'
  ) THEN
    CREATE TRIGGER update_personality_analysis_updated_at
      BEFORE UPDATE ON public.personality_analysis
      FOR EACH ROW
      EXECUTE FUNCTION set_personality_analysis_updated_at();
  END IF;
END $$;
