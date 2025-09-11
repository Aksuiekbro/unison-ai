import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export interface DashboardStats {
  activeJobs: number
  newCandidates: number
  weeklyInterviews: number
  averageMatchScore: number
}

export interface JobWithStats {
  id: string
  title: string
  status: string
  postedAt: string
  totalCandidates: number
  newCandidates: number
  company: {
    name: string
  }
}

export interface DashboardData {
  stats: DashboardStats
  activeJobs: JobWithStats[]
}

export class EmployerDashboardService {
  private supabase: any

  constructor() {
    this.supabase = createServerComponentClient<Database>({ cookies })
  }

  async getDashboardData(employerId: string): Promise<DashboardData> {
    const [stats, activeJobs] = await Promise.all([
      this.getDashboardStats(employerId),
      this.getActiveJobs(employerId)
    ])

    return {
      stats,
      activeJobs
    }
  }

  private async getDashboardStats(employerId: string): Promise<DashboardStats> {
    // Get active jobs count
    const { count: activeJobsCount } = await this.supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', employerId)
      .eq('status', 'published')

    // Get new candidates in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: newCandidatesCount } = await this.supabase
      .from('applications')
      .select('*, jobs!inner(*)', { count: 'exact', head: true })
      .eq('jobs.employer_id', employerId)
      .gte('applied_at', sevenDaysAgo.toISOString())

    // Get weekly interviews (applications with status 'interview')
    const { count: weeklyInterviews } = await this.supabase
      .from('applications')
      .select('*, jobs!inner(*)', { count: 'exact', head: true })
      .eq('jobs.employer_id', employerId)
      .eq('status', 'interview')
      .gte('applied_at', sevenDaysAgo.toISOString())

    // Get average match score
    const { data: matchScores } = await this.supabase
      .from('match_scores')
      .select('overall_score, jobs!inner(*)')
      .eq('jobs.employer_id', employerId)

    const averageMatchScore = matchScores && matchScores.length > 0
      ? Math.round(matchScores.reduce((sum: number, score: any) => sum + parseFloat(score.overall_score), 0) / matchScores.length)
      : 0

    return {
      activeJobs: activeJobsCount || 0,
      newCandidates: newCandidatesCount || 0,
      weeklyInterviews: weeklyInterviews || 0,
      averageMatchScore
    }
  }

  private async getActiveJobs(employerId: string): Promise<JobWithStats[]> {
    // Get jobs with application statistics
    const { data: jobs } = await this.supabase
      .from('jobs')
      .select(`
        id,
        title,
        status,
        posted_at,
        companies (
          name
        )
      `)
      .eq('employer_id', employerId)
      .eq('status', 'published')
      .order('posted_at', { ascending: false })

    if (!jobs) return []

    // Get application counts for each job
    const jobsWithStats = await Promise.all(
      jobs.map(async (job: any) => {
        // Total candidates
        const { count: totalCandidates } = await this.supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id)

        // New candidates in last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { count: newCandidates } = await this.supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id)
          .gte('applied_at', sevenDaysAgo.toISOString())

        return {
          id: job.id,
          title: job.title,
          status: job.status,
          postedAt: this.formatRelativeDate(job.posted_at),
          totalCandidates: totalCandidates || 0,
          newCandidates: newCandidates || 0,
          company: {
            name: job.companies?.name || 'Unknown Company'
          }
        }
      })
    )

    return jobsWithStats
  }

  private formatRelativeDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 день назад'
    if (diffDays < 7) return `${diffDays} дней назад`
    if (diffDays < 14) return '1 неделю назад'
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} недели назад`
    return `${Math.floor(diffDays / 30)} месяцев назад`
  }
}

export const employerDashboardService = new EmployerDashboardService()