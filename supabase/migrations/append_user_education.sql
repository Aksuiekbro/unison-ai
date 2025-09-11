-- Atomic append of a JSONB education object to users.educations
-- Ensures a single UPDATE so concurrent requests don't overwrite each other

-- Drop and recreate for idempotency when applying locally
DROP FUNCTION IF EXISTS public.append_user_education(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.append_user_education(
  p_user_id uuid,
  p_education jsonb
) RETURNS public.users
LANGUAGE sql
VOLATILE
AS $$
  UPDATE public.users AS u
  SET educations = COALESCE(u.educations, '[]'::jsonb) || jsonb_build_array(p_education)
  WHERE u.id = p_user_id
  RETURNING u.*;
$$;

-- Optional: you may add GRANT if needed depending on your RLS policies
-- GRANT EXECUTE ON FUNCTION public.append_user_education(uuid, jsonb) TO authenticated, anon;


