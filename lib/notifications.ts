import type { Application } from '@/lib/actions/jobs'

type EmailResult = { delivered: boolean; reason?: string }

async function sendViaResend(payload: {
  to: string
  subject: string
  html: string
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.APPLICATION_STATUS_EMAIL_FROM || 'notifications@unison.ai'
  if (!apiKey) {
    return { delivered: false, reason: 'resend-missing-key' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error('[notifications] Resend request failed', response.status, text)
      return { delivered: false, reason: 'resend-request-failed' }
    }

    return { delivered: true }
  } catch (error) {
    console.error('[notifications] Error sending via Resend', error)
    return { delivered: false, reason: 'resend-error' }
  }
}

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

function buildEmailBody({
  status,
  candidateName,
  jobTitle,
  companyName,
  notes,
}: {
  status: Application['status']
  candidateName?: string | null
  jobTitle?: string | null
  companyName?: string | null
  notes?: string | null
}) {
  const safeCandidate = candidateName || 'Кандидат'
  const safeJob = jobTitle || 'вашей вакансии'
  const safeCompany = companyName || 'Unison AI'

  return `
    <p>Здравствуйте, ${safeCandidate}!</p>
    <p>Статус вашей заявки на позицию <strong>${safeJob}</strong> в компании <strong>${safeCompany}</strong> изменился: <strong>${status}</strong>.</p>
    ${notes ? `<p>Комментарий: ${notes}</p>` : ''}
    <p>Спасибо, что используете Unison AI.</p>
  `
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
    // Try direct provider fallback (Resend) if configured
    const resendResult = await sendViaResend({
      to: candidateEmail,
      subject: `Application status updated: ${status}`,
      html: buildEmailBody({ status, candidateName, jobTitle, companyName, notes }),
    })
    return resendResult
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
      // Fallback to Resend if primary endpoint failed and key exists
      const resendResult = await sendViaResend({
        to: candidateEmail,
        subject: `Application status updated: ${status}`,
        html: buildEmailBody({ status, candidateName, jobTitle, companyName, notes }),
      })
      return resendResult
    }

    return { delivered: true }
  } catch (error) {
    console.error(
      `[notifications] Error while sending candidate status notification for application ${applicationId}:`,
      error
    )
    const resendResult = await sendViaResend({
      to: candidateEmail,
      subject: `Application status updated: ${status}`,
      html: buildEmailBody({ status, candidateName, jobTitle, companyName, notes }),
    })
    return resendResult
  }
}
