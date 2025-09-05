-- Insert sample skills
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
('Problem Solving', 'Soft Skills');

-- Sample companies
INSERT INTO public.companies (name, description, website, industry, size, location) VALUES
('Tech Startup Inc.', 'Innovative technology solutions for modern businesses.', 'https://techstartup.com', 'Technology', '11-50', 'San Francisco, CA'),
('Digital Agency Pro', 'Full-service digital marketing and web development agency.', 'https://digitalagencypro.com', 'Marketing', '51-200', 'Austin, TX'),
('FinTech Solutions', 'Revolutionary financial technology for the modern world.', 'https://fintechsolutions.com', 'Finance', '201-500', 'New York, NY');

-- Note: In a real application, you would create users through Supabase Auth
-- and then insert corresponding records into the public.users table.
-- The following are example records that would be created after user authentication.

-- Example seed data for testing (commented out as it requires actual auth users):
/*
-- Sample users (these would be created through Supabase Auth first)
INSERT INTO public.users (id, email, full_name, role, location, bio, company_id) VALUES
('00000000-0000-0000-0000-000000000001', 'employer@example.com', 'John Smith', 'employer', 'San Francisco, CA', 'Experienced tech recruiter and startup founder.', (SELECT id FROM public.companies WHERE name = 'Tech Startup Inc.')),
('00000000-0000-0000-0000-000000000002', 'jobseeker@example.com', 'Jane Doe', 'job_seeker', 'New York, NY', 'Full-stack developer with 5 years of experience.', NULL);

-- Sample job
INSERT INTO public.jobs (title, description, requirements, responsibilities, company_id, job_type, experience_level, salary_min, salary_max, location, remote_allowed, status, posted_at) VALUES
('Senior Full Stack Developer', 'Join our growing team to build cutting-edge web applications.', 
'5+ years of experience with React and Node.js, strong understanding of database design, experience with cloud platforms.',
'Develop and maintain web applications, collaborate with cross-functional teams, mentor junior developers.',
(SELECT id FROM public.companies WHERE name = 'Tech Startup Inc.'),
'full_time', 'senior', 120000, 180000, 'San Francisco, CA', true, 'published', NOW());

-- Sample job skills
INSERT INTO public.job_skills (job_id, skill_id, required) VALUES
((SELECT id FROM public.jobs WHERE title = 'Senior Full Stack Developer'), (SELECT id FROM public.skills WHERE name = 'JavaScript'), true),
((SELECT id FROM public.jobs WHERE title = 'Senior Full Stack Developer'), (SELECT id FROM public.skills WHERE name = 'React'), true),
((SELECT id FROM public.jobs WHERE title = 'Senior Full Stack Developer'), (SELECT id FROM public.skills WHERE name = 'Node.js'), true),
((SELECT id FROM public.jobs WHERE title = 'Senior Full Stack Developer'), (SELECT id FROM public.skills WHERE name = 'PostgreSQL'), false),
((SELECT id FROM public.jobs WHERE title = 'Senior Full Stack Developer'), (SELECT id FROM public.skills WHERE name = 'AWS'), false);

-- Sample user skills
INSERT INTO public.user_skills (user_id, skill_id, proficiency_level) VALUES
('00000000-0000-0000-0000-000000000002', (SELECT id FROM public.skills WHERE name = 'JavaScript'), 5),
('00000000-0000-0000-0000-000000000002', (SELECT id FROM public.skills WHERE name = 'React'), 4),
('00000000-0000-0000-0000-000000000002', (SELECT id FROM public.skills WHERE name = 'Node.js'), 4),
('00000000-0000-0000-0000-000000000002', (SELECT id FROM public.skills WHERE name = 'PostgreSQL'), 3);

-- Sample application
INSERT INTO public.applications (job_id, applicant_id, status, cover_letter, applied_at) VALUES
((SELECT id FROM public.jobs WHERE title = 'Senior Full Stack Developer'), '00000000-0000-0000-0000-000000000002', 'pending', 
'I am excited to apply for the Senior Full Stack Developer position. With over 5 years of experience building scalable web applications...', NOW());
*/