-- Add INSERT policy for applications table
-- Job seekers should be able to create applications for jobs

CREATE POLICY "Job seekers can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = applicant_id
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'job_seeker'
  )
);

