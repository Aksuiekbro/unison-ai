import { supabase } from './supabase-client';
import { supabaseAdmin } from './supabase-admin';
import type { Application, ApplicationStatus, ApplicationWithDetails, JobNew } from './types';

export async function submitApplication(
  jobId: string,
  candidateId: string,
  employerId: string,
  message?: string
): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      employer_id: employerId,
      message,
      status: 'applied'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit application: ${error.message}`);
  }

  return data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  userId: string
): Promise<Application> {
  // First verify the user is the employer for this application
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select('employer_id')
    .eq('id', applicationId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch application: ${fetchError.message}`);
  }

  if (application.employer_id !== userId) {
    throw new Error('Unauthorized: You can only update applications for your own jobs');
  }

  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update application status: ${error.message}`);
  }

  return data;
}

export async function getCandidateApplications(candidateId: string): Promise<ApplicationWithDetails[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs (
        id,
        title,
        description,
        location,
        salary_min,
        salary_max,
        employment_type,
        experience_level,
        employer:users!jobs_employer_id_fkey (
          id,
          full_name,
          company_name
        )
      )
    `)
    .eq('candidate_id', candidateId)
    .order('applied_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch candidate applications: ${error.message}`);
  }

  return data as ApplicationWithDetails[];
}

export async function getEmployerApplications(employerId: string): Promise<ApplicationWithDetails[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs (
        id,
        title,
        description,
        location,
        salary_min,
        salary_max,
        employment_type,
        experience_level
      ),
      candidate:users!applications_candidate_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('employer_id', employerId)
    .order('applied_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch employer applications: ${error.message}`);
  }

  return data as ApplicationWithDetails[];
}

export async function getApplicationsByJob(jobId: string, employerId: string): Promise<ApplicationWithDetails[]> {
  // Verify the employer owns this job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('employer_id')
    .eq('id', jobId)
    .single();

  if (jobError) {
    throw new Error(`Failed to fetch job: ${jobError.message}`);
  }

  if (job.employer_id !== employerId) {
    throw new Error('Unauthorized: You can only view applications for your own jobs');
  }

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs (
        id,
        title,
        description,
        location,
        salary_min,
        salary_max,
        employment_type,
        experience_level
      ),
      candidate:users!applications_candidate_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('job_id', jobId)
    .order('applied_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch job applications: ${error.message}`);
  }

  return data as ApplicationWithDetails[];
}

export async function hasAppliedToJob(jobId: string, candidateId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('candidate_id', candidateId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check application status: ${error.message}`);
  }

  return data !== null;
}