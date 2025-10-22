"use client"

import { useState, useEffect } from 'react'
import type { Job, JobStatus, Application, JobType } from '@/lib/actions/jobs'

export function useJobs(employerId: string) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async (filters?: {
    status?: JobStatus
    job_type?: JobType
    search?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters?.status && ['draft','published','closed','cancelled'].includes(filters.status)) params.set('status', filters.status)
      if (filters?.job_type) params.set('job_type', filters.job_type)
      if (filters?.search) params.set('search', filters.search)

      const res = await fetch(`/api/employer/jobs?${params.toString()}`, { cache: 'no-store' })
      const result = await res.json()
      if (result.success) {
        setJobs(result.data)
      } else {
        setError(result.error || 'Failed to fetch jobs')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch jobs')
    }
    setLoading(false)
  }

  const createNewJob = async (jobData: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'views'>) => {
    const res = await fetch('/api/employer/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    })
    const result = await res.json()
    if (result.success) await fetchJobs()
    return result
  }

  const updateExistingJob = async (jobId: string, updates: Partial<Job>) => {
    const res = await fetch(`/api/employer/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const result = await res.json()
    if (result.success) await fetchJobs()
    return result
  }

  const removeJob = async (jobId: string) => {
    const res = await fetch(`/api/employer/jobs/${jobId}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await fetchJobs()
    return result
  }

  const changeJobStatus = async (jobId: string, status: JobStatus) => {
    const res = await fetch(`/api/employer/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await res.json()
    if (result.success) await fetchJobs()
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
    try {
      const [appsRes, statsRes] = await Promise.all([
        fetch(`/api/employer/jobs/${jobId}/applications`, { cache: 'no-store' }),
        fetch(`/api/employer/jobs/${jobId}/stats`, { cache: 'no-store' }),
      ])
      const applicationsResult = await appsRes.json()
      const statsResult = await statsRes.json()
      if (applicationsResult.success) setApplications(applicationsResult.data)
      else setError(applicationsResult.error)
      if (statsResult.success) setStats(statsResult.data)
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch applications')
    }
    setLoading(false)
  }

  const updateStatus = async (applicationId: string, status: Application['status']) => {
    const res = await fetch(`/api/employer/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await res.json()
    if (result.success) await fetchApplications()
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