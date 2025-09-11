-- Atomic append of a JSONB experience object to users.experiences
-- Ensures a single UPDATE so concurrent requests don't overwrite each other

-- Drop and recreate for idempotency when applying locally
DROP FUNCTION IF EXISTS public.append_user_experience(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.append_user_experience(
  p_user_id uuid,
  p_experience jsonb
) RETURNS public.users
LANGUAGE sql
VOLATILE
AS $$
  UPDATE public.users AS u
  SET experiences = COALESCE(u.experiences, '[]'::jsonb) || jsonb_build_array(p_experience)
  WHERE u.id = p_user_id
  RETURNING u.*;
$$;

-- Optional: GRANT execute depending on your RLS policies
-- GRANT EXECUTE ON FUNCTION public.append_user_experience(uuid, jsonb) TO authenticated, anon;


