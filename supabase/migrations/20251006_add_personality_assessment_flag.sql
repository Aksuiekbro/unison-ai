-- Add the new completion flag for the personality assessment
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS personality_assessment_completed BOOLEAN DEFAULT false;

-- Backfill from legacy profile flag when available
UPDATE users AS u
SET personality_assessment_completed = true
FROM profiles AS p
WHERE p.user_id = u.id
  AND COALESCE(p.personality_test_completed, false) = true
  AND COALESCE(u.personality_assessment_completed, false) = false;
