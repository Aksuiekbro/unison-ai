import { useState, useEffect } from 'react'
import { 
  getJobs, 
  createJob, 
  updateJob, 
  deleteJob, 
  updateJobStatus,
  getJobApplications,
  updateApplicationStatus,
  getApplicationStats,
  Job, 
  JobStatus,
  Application 
} from '@/lib/actions/jobs'

export function useJobs(employerId: string) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async (filters?: {
    status?: JobStatus
    department?: string
    search?: string
  }) => {
    setLoading(true)
    setError(null)
    
    const result = await getJobs(employerId, filters)
    
    if (result.success) {
      setJobs(result.data)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const createNewJob = async (jobData: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'views'>) => {
    const result = await createJob(jobData)
    
    if (result.success) {
      await fetchJobs()
    }
    
    return result
  }

  const updateExistingJob = async (jobId: string, updates: Partial<Job>) => {
    const result = await updateJob(jobId, updates)
    
    if (result.success) {
      await fetchJobs()
    }
    
    return result
  }

  const removeJob = async (jobId: string) => {
    const result = await deleteJob(jobId, employerId)
    
    if (result.success) {
      await fetchJobs()
    }
    
    return result
  }

  const changeJobStatus = async (jobId: string, status: JobStatus) => {
    const result = await updateJobStatus(jobId, status, employerId)
    
    if (result.success) {
      await fetchJobs()
    }
    
    return result
  }

  useEffect(() => {
    fetchJobs()
  }, [employerId])

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    createNewJob,
    updateExistingJob,
    removeJob,
    changeJobStatus,
    refetch: fetchJobs
  }
}

export function useJobApplications(jobId: string, employerId: string) {
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApplications = async () => {
    setLoading(true)
    setError(null)
    
    const [applicationsResult, statsResult] = await Promise.all([
      getJobApplications(jobId, employerId),
      getApplicationStats(jobId, employerId)
    ])
    
    if (applicationsResult.success) {
      setApplications(applicationsResult.data)
    } else {
      setError(applicationsResult.error)
    }
    
    if (statsResult.success) {
      setStats(statsResult.data)
    }
    
    setLoading(false)
  }

  const updateStatus = async (applicationId: string, status: Application['status']) => {
    const result = await updateApplicationStatus(applicationId, status, employerId)
    
    if (result.success) {
      await fetchApplications()
    }
    
    return result
  }

  useEffect(() => {
    if (jobId && employerId) {
      fetchApplications()
    }
  }, [jobId, employerId])

  return {
    applications,
    stats,
    loading,
    error,
    updateStatus,
    refetch: fetchApplications
  }
}