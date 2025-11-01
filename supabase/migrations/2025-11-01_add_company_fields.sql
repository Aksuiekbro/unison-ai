-- supabase/migrations/2025-11-01_add_company_fields.sql
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS company_culture TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS technologies TEXT[] DEFAULT ARRAY[]::text[];