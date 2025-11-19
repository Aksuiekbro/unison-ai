import type { Application } from '@/lib/actions/jobs'

type NotifiableStatus = Extract<
  Application['status'],
  'interview' | 'interviewed' | 'offered' | 'accepted' | 'hired' | 'rejected'
>

const NOTIFIABLE_STATUSES: NotifiableStatus[] = [
  'interview',
  'interviewed',
  'offered',
  'accepted',
  'hired',
  'rejected',
]

interface CandidateStatusNotification {
  applicationId: string
  status: Application['status']
  candidateEmail?: string | null
  candidateName?: string | null
  jobTitle?: string | null
  companyName?: string | null
  notes?: string | null
}

interface NotificationResult {
  delivered: boolean
  reason?: string
}

function resolveNotificationEndpoint() {
  if (process.env.APPLICATION_STATUS_EMAIL_ENDPOINT) {
    return process.env.APPLICATION_STATUS_EMAIL_ENDPOINT
  }

  const supabaseUrl = process.env.SUPABASE_URL
  if (!supabaseUrl) {
    return null
  }

  const functionName = process.env.APPLICATION_STATUS_EMAIL_FUNCTION || 'notify-application-status'
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`
}

export function shouldNotifyCandidate(status: Application['status']): status is NotifiableStatus {
  return NOTIFIABLE_STATUSES.includes(status as NotifiableStatus)
}

export async function notifyCandidateStatusChange({
  applicationId,
  status,
  candidateEmail,
  candidateName,
  jobTitle,
  companyName,
  notes,
}: CandidateStatusNotification): Promise<NotificationResult> {
  if (!shouldNotifyCandidate(status)) {
    return { delivered: false, reason: 'status-not-configured' }
  }

  if (!candidateEmail) {
    console.warn(`[notifications] Missing candidate email for application ${applicationId}; skipping notification`)
    return { delivered: false, reason: 'missing-email' }
  }

  const endpoint = resolveNotificationEndpoint()
  if (!endpoint) {
    console.warn('[notifications] APPLICATION_STATUS_EMAIL_ENDPOINT or SUPABASE_URL is not configured; skipping notification')
    return { delivered: false, reason: 'missing-endpoint' }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const authToken =
    process.env.APPLICATION_STATUS_EMAIL_TOKEN ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        applicationId,
        status,
        notes,
        candidate: {
          email: candidateEmail,
          name: candidateName,
        },
        job: {
          title: jobTitle,
          company: companyName,
        },
      }),
    })

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => '')
      console.error(
        `[notifications] Failed to send candidate status email for application ${applicationId}: ${response.status} ${response.statusText} ${errorPayload}`
      )
      return { delivered: false, reason: 'request-failed' }
    }

    return { delivered: true }
  } catch (error) {
    console.error(
      `[notifications] Error while sending candidate status notification for application ${applicationId}:`,
      error
    )
    return { delivered: false, reason: 'network-error' }
  }
}
