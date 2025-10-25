-- Ensure drafts don't appear completed by default
ALTER TABLE productivity_assessments ALTER COLUMN completed_at DROP DEFAULT;

-- Add JSONB arrays for profile details if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS experiences jsonb DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS educations jsonb DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;

-- Public sharing for productivity reports
CREATE TABLE IF NOT EXISTS shared_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES productivity_assessments(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;

-- Only owner can manage their share rows via app auth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shared_reports' AND policyname = 'Users can manage own shared reports'
  ) THEN
    CREATE POLICY "Users can manage own shared reports" ON shared_reports
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


