// Mock applications data for development when Supabase is not configured
import type { Application, ApplicationStatus, ApplicationWithDetails, JobNew } from './types';

const mockApplications: ApplicationWithDetails[] = [
  {
    id: 'app_1',
    job_id: 'job_1',
    candidate_id: 'usr_employee_1',
    employer_id: 'usr_employer_1',
    status: 'applied',
    applied_date: new Date().toISOString(),
    message: 'I am very interested in this position and believe my skills would be a great fit.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    job: {
      id: 'job_1',
      employer_id: 'usr_employer_1',
      title: 'Senior Frontend Developer',
      description: 'We are looking for an experienced frontend developer to join our team.',
      location: 'San Francisco, CA',
      salary_min: 120000,
      salary_max: 150000,
      employment_type: 'full-time',
      experience_level: 'senior',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      employer: {
        id: 'usr_employer_1',
        email: 'employer@unison.ai',
        role: 'employer',
        full_name: 'John Employer',
        company_name: 'Acme Inc.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    },
    candidate: {
      id: 'usr_employee_1',
      email: 'employee@unison.ai',
      role: 'job-seeker',
      full_name: 'Jane Employee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
];

export async function submitApplication(
  jobId: string,
  candidateId: string,
  employerId: string,
  message?: string
): Promise<Application> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newApplication: Application = {
    id: `app_${Date.now()}`,
    job_id: jobId,
    candidate_id: candidateId,
    employer_id: employerId,
    status: 'applied',
    applied_date: new Date().toISOString(),
    message,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  return newApplication;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  userId: string
): Promise<Application> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const application = mockApplications.find(app => app.id === applicationId);
  if (!application) {
    throw new Error('Application not found');
  }
  
  if (application.employer_id !== userId) {
    throw new Error('Unauthorized: You can only update applications for your own jobs');
  }
  
  application.status = status;
  application.updated_at = new Date().toISOString();
  
  return application;
}

export async function getCandidateApplications(candidateId: string): Promise<ApplicationWithDetails[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockApplications.filter(app => app.candidate_id === candidateId);
}

export async function getEmployerApplications(employerId: string): Promise<ApplicationWithDetails[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockApplications.filter(app => app.employer_id === employerId);
}

export async function getApplicationsByJob(jobId: string, employerId: string): Promise<ApplicationWithDetails[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockApplications.filter(app => app.job_id === jobId && app.employer_id === employerId);
}

export async function hasAppliedToJob(jobId: string, candidateId: string): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mockApplications.some(app => app.job_id === jobId && app.candidate_id === candidateId);
}