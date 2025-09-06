-- Canonical seeds for unified schema (public.profiles)

-- Idempotent insert of sample skills
INSERT INTO public.skills (name, category) VALUES
('JavaScript', 'Programming'),
('TypeScript', 'Programming'),
('React', 'Frontend'),
('Next.js', 'Frontend'),
('Node.js', 'Backend'),
('Python', 'Programming'),
('PostgreSQL', 'Database'),
('AWS', 'Cloud'),
('Docker', 'DevOps'),
('Git', 'Version Control'),
('UI/UX Design', 'Design'),
('Project Management', 'Management'),
('Communication', 'Soft Skills'),
('Leadership', 'Management'),
('Problem Solving', 'Soft Skills')
ON CONFLICT (name) DO NOTHING;

-- Companies seed requires a valid employer profile id (owner_id). Example:
-- INSERT INTO public.profiles (id, email, first_name, last_name, role)
-- VALUES ('00000000-0000-0000-0000-0000000000AA', 'employer@example.com', 'John', 'Employer', 'employer')
-- ON CONFLICT (id) DO NOTHING;
-- INSERT INTO public.companies (name, description, website, industry, size, location, owner_id)
-- VALUES ('Tech Startup Inc.', 'Innovative technology solutions', 'https://techstartup.com', 'Technology', '11-50', 'San Francisco, CA', '00000000-0000-0000-0000-0000000000AA')
-- ON CONFLICT DO NOTHING;

-- Note: Users should be created via Supabase Auth. After signup, insert into public.profiles.
-- Example (requires an existing auth.users row with id '...'):
-- INSERT INTO public.profiles (id, email, first_name, last_name, role)
-- VALUES ('00000000-0000-0000-0000-0000000000BB', 'jobseeker@example.com', 'Jane', 'Doe', 'job_seeker')
-- ON CONFLICT (id) DO NOTHING;

-- Example job seeding (requires a valid company owner and company row):
-- INSERT INTO public.jobs (title, description, company_id, job_type, experience_level, salary_min, salary_max, location, status, posted_at)
-- VALUES ('Senior Full Stack Developer', 'Join our team...', (SELECT id FROM public.companies WHERE name = 'Tech Startup Inc.'), 'full_time', 'senior', 120000, 180000, 'San Francisco, CA', 'published', NOW())
-- ON CONFLICT DO NOTHING;