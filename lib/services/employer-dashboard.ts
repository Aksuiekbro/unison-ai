import type { Database } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

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
  private supabase: SupabaseClient<Database>

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient
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
      .select('id', { count: 'exact', head: true })
      .eq('employer_id', employerId)
      .eq('status', 'published')

    // Get new candidates in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: newCandidatesCount } = await this.supabase
      .from('applications')
      .select('id, jobs!inner(employer_id)', { count: 'exact', head: true })
      .eq('jobs.employer_id', employerId)
      .gte('applied_at', sevenDaysAgo.toISOString())

    // Get weekly interviews (applications with status 'interview')
    const { count: weeklyInterviews } = await this.supabase
      .from('applications')
      .select('id, jobs!inner(employer_id)', { count: 'exact', head: true })
      .eq('jobs.employer_id', employerId)
      .eq('status', 'interview')
      .gte('applied_at', sevenDaysAgo.toISOString())

    // Get average match score
    const { data: matchScores } = await this.supabase
      .from('match_scores')
      .select('overall_score, jobs!inner(employer_id)')
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

    if (!jobs || jobs.length === 0) return []

    const jobIds = jobs.map((job: any) => job.id)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Fetch application rows once and aggregate in memory to avoid per-job count queries
    const [{ data: allApps }, { data: recentApps }] = await Promise.all([
      this.supabase
        .from('applications')
        .select('id, job_id')
        .in('job_id', jobIds),
      this.supabase
        .from('applications')
        .select('id, job_id, applied_at')
        .in('job_id', jobIds)
        .gte('applied_at', sevenDaysAgo.toISOString())
    ])

    const totalMap = new Map<string, number>()
    ;(allApps || []).forEach((row) => {
      totalMap.set(row.job_id, (totalMap.get(row.job_id) || 0) + 1)
    })

    const recentMap = new Map<string, number>()
    ;(recentApps || []).forEach((row) => {
      recentMap.set(row.job_id, (recentMap.get(row.job_id) || 0) + 1)
    })

    return jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      postedAt: job.posted_at,
      totalCandidates: totalMap.get(job.id) || 0,
      newCandidates: recentMap.get(job.id) || 0,
      company: {
        name: job.companies?.name || 'Unknown Company'
      }
    }))
  }
}
