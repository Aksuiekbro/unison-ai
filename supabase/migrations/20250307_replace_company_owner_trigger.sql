-- Replace legacy company owner validation that referenced the removed public.profiles table.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'companies_validate_owner_is_employer' 
      AND tgrelid = 'public.companies'::regclass
  ) THEN
    DROP TRIGGER companies_validate_owner_is_employer ON public.companies;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.validate_company_owner_is_employer();

CREATE OR REPLACE FUNCTION public.validate_company_owner_is_employer()
RETURNS TRIGGER AS $$
DECLARE
  owner_role public.user_role;
BEGIN
  SELECT role INTO owner_role
  FROM public.users
  WHERE id = NEW.owner_id;

  IF owner_role IS NULL THEN
    RAISE EXCEPTION 'Owner user not found for owner_id: %', NEW.owner_id;
  END IF;

  IF owner_role != 'employer' THEN
    RAISE EXCEPTION 'Only users with employer role can own companies. Current role: %', owner_role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'companies_validate_owner_is_employer' 
      AND tgrelid = 'public.companies'::regclass
  ) THEN
    CREATE TRIGGER companies_validate_owner_is_employer
      BEFORE INSERT OR UPDATE ON public.companies
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_company_owner_is_employer();
  END IF;
END $$;
