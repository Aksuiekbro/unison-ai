-- Fix trigger functions that reference the removed public.profiles table
-- These functions should use public.users instead

-- Fix validate_company_owner_role function
CREATE OR REPLACE FUNCTION public.validate_company_owner_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = NEW.owner_id AND role = 'employer'
  ) THEN
    RAISE EXCEPTION 'User % must have employer role to own company', NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix validate_application_applicant_role function
CREATE OR REPLACE FUNCTION public.validate_application_applicant_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = NEW.applicant_id AND role = 'job_seeker'
  ) THEN
    RAISE EXCEPTION 'User % must have job_seeker role to create/update application', NEW.applicant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

