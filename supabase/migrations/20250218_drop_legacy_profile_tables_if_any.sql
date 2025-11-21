-- Clean up legacy profile tables; no-op if already removed
DROP TABLE IF EXISTS public.experiences CASCADE;
DROP TABLE IF EXISTS public.educations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
