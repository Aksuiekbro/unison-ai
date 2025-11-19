-- DEPRECATED: Not canonical. The application now uses the unified schema in `supabase/schema.sql`.
-- This file is retained for reference only and is not used by deployments.

-- Database schema for job posting and application management system

-- Users table (already exists, adding company_id column)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  location VARCHAR(255),
  experience_years INTEGER,
  role VARCHAR(50) NOT NULL CHECK (role IN ('employer', 'job_seeker')),
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  industry VARCHAR(255),
  size VARCHAR(50),
  location VARCHAR(255),
  logo_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  location VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
  experience_level VARCHAR(50) NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'reviewing', 'interview', 'interviewed', 'offered', 'hired', 'accepted', 'rejected')
  ),
  cover_letter TEXT,
  resume_url VARCHAR(500),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(job_id, applicant_id) -- Prevent duplicate applications
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policies for jobs table
-- Employers can only see/manage jobs from their company
CREATE POLICY "Employers can view their company jobs" ON jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'employer' 
      AND users.company_id = jobs.company_id
    )
  );

CREATE POLICY "Employers can insert jobs for their company" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'employer' 
      AND users.company_id = jobs.company_id
      AND users.id = jobs.employer_id
    )
  );

CREATE POLICY "Employers can update their company jobs" ON jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'employer' 
      AND users.company_id = jobs.company_id
    )
  );

CREATE POLICY "Employers can delete their company jobs" ON jobs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'employer' 
      AND users.company_id = jobs.company_id
    )
  );

-- Job seekers can view active jobs
CREATE POLICY "Job seekers can view active jobs" ON jobs
  FOR SELECT USING (status = 'active');

-- Policies for applications table
-- Employers can view applications for their company jobs
CREATE POLICY "Employers can view applications for their jobs" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN users ON users.id = auth.uid()
      WHERE jobs.id = applications.job_id 
      AND users.role = 'employer'
      AND users.company_id = jobs.company_id
    )
  );

-- Employers can update application status for their company jobs
CREATE POLICY "Employers can update application status" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN users ON users.id = auth.uid()
      WHERE jobs.id = applications.job_id 
      AND users.role = 'employer'
      AND users.company_id = jobs.company_id
    )
  );

-- Job seekers can view and insert their own applications
CREATE POLICY "Job seekers can view their applications" ON applications
  FOR SELECT USING (applicant_id = auth.uid());

CREATE POLICY "Job seekers can create applications" ON applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

-- Policies for companies table
CREATE POLICY "Employers can view their company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.company_id = companies.id
    )
  );

CREATE POLICY "Employers can update their company" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'employer'
      AND users.company_id = companies.id
    )
  );

-- Sample data for testing
INSERT INTO companies (id, name, description, industry, location) VALUES 
('company_1', 'TechCorp Inc.', 'Leading technology company', 'Technology', 'Москва')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, full_name, role, company_id) VALUES 
('usr_employer_1', 'employer@unison.ai', 'John Employer', 'employer', 'company_1'),
('usr_employee_1', 'employee@unison.ai', 'Jane Employee', 'job_seeker', NULL)
ON CONFLICT (id) DO NOTHING;
