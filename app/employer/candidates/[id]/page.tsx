import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  Users,
  Brain,
  TrendingUp,
} from 'lucide-react'

import type { Database } from '@/lib/database.types'
import { getApplicationDetails } from '@/lib/actions/jobs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

const statusText: Record<string, string> = {
  pending: 'В ожидании',
  reviewing: 'На рассмотрении',
  interview: 'Собеседование',
  interviewed: 'Собеседование',
  offered: 'Предложение',
  hired: 'Принят',
  accepted: 'Принят',
  rejected: 'Отклонен',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-500',
  reviewing: 'bg-blue-500',
  interview: 'bg-purple-500',
  interviewed: 'bg-purple-500',
  offered: 'bg-green-500',
  hired: 'bg-emerald-600',
  accepted: 'bg-emerald-600',
  rejected: 'bg-red-500',
}

const personalityLabels: { key: keyof Database['public']['Tables']['personality_analysis']['Row']; label: string }[] = [
  { key: 'analytical_score', label: 'Аналитика' },
  { key: 'creative_score', label: 'Креативность' },
  { key: 'leadership_score', label: 'Лидерство' },
  { key: 'teamwork_score', label: 'Командная работа' },
]

const matchComponents: { key: keyof Database['public']['Tables']['match_scores']['Row']; label: string }[] = [
  { key: 'skills_match_score', label: 'Навыки' },
  { key: 'experience_match_score', label: 'Опыт' },
  { key: 'culture_fit_score', label: 'Культура' },
  { key: 'personality_match_score', label: 'Личность' },
]

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirect=/employer/candidates/${params.id}`)
  }

  const result = await getApplicationDetails(params.id, user.id)

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <CardTitle className="text-xl text-[#0A2540]">Не удалось загрузить кандидата</CardTitle>
            <p className="text-[#333333]">{result.error || 'Попробуйте обновить страницу.'}</p>
            <Link href="/employer/jobs">
              <Button>Вернуться к вакансиям</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { application, matchScoreDetails, personalityAnalysis, resumeUrl } = result.data
  const applicant = application.applicant
  const experiences = Array.isArray(applicant.experiences) ? applicant.experiences : []
  const educations = Array.isArray(applicant.educations) ? applicant.educations : []
  const skills = Array.isArray(applicant.skills) ? applicant.skills : []
  const strengths = parseList(matchScoreDetails?.strengths)
  const concerns = parseList(matchScoreDetails?.potential_concerns)
  const matchScore = application.matchScore ?? matchScoreDetails?.overall_score ?? null
  const statusBadge = application.status || 'pending'
  const jobCandidatesLink = `/employer/jobs/${application.job_id}/candidates`
  const appliedAt = formatDate(application.applied_at)
  const availableResume = resumeUrl || application.resume_url || applicant.resume_url

  const contactLinks = [
    { label: 'LinkedIn', value: applicant.linkedin_url, icon: Linkedin },
    { label: 'GitHub', value: applicant.github_url, icon: Github },
    { label: 'Портфолио', value: applicant.portfolio_url, icon: Globe },
  ].filter((link) => !!link.value)

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={jobCandidatesLink}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              К списку кандидатов
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540]">Профиль кандидата</h1>
            <p className="text-[#333333]">Детальная информация и анализ совместимости</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${applicant.full_name || 'UA'}`} />
                    <AvatarFallback>{getInitials(applicant.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-[#0A2540]">{applicant.full_name}</h2>
                      <Badge className={`${statusColor[statusBadge] || 'bg-gray-500'} text-white`}>
                        {statusText[statusBadge] || statusBadge}
                      </Badge>
                    </div>
                    {applicant.current_job_title && <p className="text-lg text-[#333333]">{applicant.current_job_title}</p>}
                    <div className="flex flex-wrap gap-4 text-sm text-[#333333]">
                      {applicant.location && (
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" /> {applicant.location}
                        </span>
                      )}
                      {appliedAt && (
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" /> Отклик: {appliedAt}
                        </span>
                      )}
                    </div>
                  </div>
                  {availableResume && (
                    <Button asChild className="self-start bg-[#FF7A00] hover:bg-[#E66A00]">
                      <a href={availableResume} target="_blank" rel="noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        Открыть резюме
                      </a>
                    </Button>
                  )}
                </div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Контакты</p>
                    <div className="space-y-2 text-sm text-[#333333]">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" /> {applicant.email || '—'}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" /> {applicant.phone || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Ссылки</p>
                    <div className="flex flex-wrap gap-2">
                      {contactLinks.length === 0 && <span className="text-sm text-[#333333]">Нет ссылок</span>}
                      {contactLinks.map((link) => (
                        <Button key={link.label} variant="outline" size="sm" asChild>
                          <a href={ensureProtocol(link.value!)} target="_blank" rel="noreferrer" className="flex items-center">
                            <link.icon className="w-4 h-4 mr-2" />
                            {link.label}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">О кандидате</CardTitle>
                <CardDescription>Краткое резюме и мотивация</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#333333] leading-relaxed">{applicant.bio || 'Кандидат пока не добавил описание.'}</p>
                {application.cover_letter && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-[#0A2540] mb-2">Сопроводительное письмо</h4>
                      <p className="text-[#333333] whitespace-pre-line">{application.cover_letter}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540] flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#FF7A00]" />
                  Опыт работы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {experiences.length === 0 && <p className="text-[#333333]">Опыт работы не указан.</p>}
                {experiences.map((exp: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border bg-white space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#0A2540]">{exp.position || exp.title || 'Должность не указана'}</p>
                        <p className="text-sm text-[#333333]">{exp.company || exp.organization || exp.employer || 'Компания не указана'}</p>
                      </div>
                      <span className="text-sm text-[#333333]">{formatPeriod(exp)}</span>
                    </div>
                    {exp.description && <p className="text-sm text-[#333333]">{exp.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#FF7A00]" />
                  Образование и навыки
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-[#0A2540] mb-3">Образование</h4>
                  {educations.length === 0 && <p className="text-[#333333]">Образование не указано.</p>}
                  {educations.map((edu: any, idx: number) => (
                    <div key={idx} className="mb-4">
                      <p className="font-medium text-[#0A2540]">{edu.degree || edu.level || 'Учебное заведение'}</p>
                      <p className="text-sm text-[#333333]">{edu.institution || edu.school || 'Название не указано'}</p>
                      <p className="text-sm text-[#333333]">{edu.year || edu.period || formatPeriod(edu)}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] mb-3">Навыки</h4>
                  {skills.length === 0 && <p className="text-[#333333]">Навыки не указаны.</p>}
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 12).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {typeof skill === 'string' ? skill : skill?.name || 'Навык'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540] flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#FF7A00]" />
                  Match Score
                </CardTitle>
                <CardDescription>AI-совместимость с вакансией</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#333333] mb-1">Общий балл</p>
                    <div className="text-4xl font-bold text-[#FF7A00]">{matchScore != null ? `${matchScore}%` : 'N/A'}</div>
                  </div>
                  {matchScore != null && (
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24">
                        <circle cx="48" cy="48" r="40" stroke="#E5E7EB" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#FF7A00"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${((100 - matchScore) / 100) * 2 * Math.PI * 40}`}
                          strokeLinecap="round"
                          transform="rotate(-90 48 48)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-[#0A2540]">
                        {matchScore}%
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {matchComponents.map(({ key, label }) => {
                    const componentValue = matchScoreDetails?.[key] as number | null | undefined
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm text-[#333333]">
                          <span>{label}</span>
                          <span>{componentValue != null ? `${componentValue}%` : '—'}</span>
                        </div>
                        <Progress value={componentValue || 0} className="h-2" />
                      </div>
                    )
                  })}
                </div>
                {matchScoreDetails?.match_explanation && (
                  <div className="p-3 rounded-lg bg-gray-50 text-sm text-[#333333]">
                    {matchScoreDetails.match_explanation}
                  </div>
                )}
                {(strengths.length > 0 || concerns.length > 0) && (
                  <div className="space-y-3">
                    {strengths.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-[#0A2540] mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4 text-green-600" />
                          Сильные стороны
                        </h4>
                        <ul className="list-disc list-inside text-sm text-[#333333] space-y-1">
                          {strengths.map((item, idx) => (
                            <li key={`strength-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {concerns.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-[#0A2540] mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-amber-600" />
                          Зоны роста
                        </h4>
                        <ul className="list-disc list-inside text-sm text-[#333333] space-y-1">
                          {concerns.map((item, idx) => (
                            <li key={`concern-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540] flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#FF7A00]" />
                  Профиль личности
                </CardTitle>
                <CardDescription>Результаты анализа Gemini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {personalityAnalysis ? (
                  <>
                    {personalityLabels.map(({ key, label }) => {
                      const score = personalityAnalysis[key] as number | null | undefined
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-sm text-[#333333]">
                            <span>{label}</span>
                            <span>{score != null ? `${score}%` : '—'}</span>
                          </div>
                          <Progress value={score || 0} className="h-2" />
                        </div>
                      )
                    })}
                    <Separator />
                    <div className="space-y-2 text-sm text-[#333333]">
                      {personalityAnalysis.problem_solving_style && (
                        <p>
                          <span className="font-semibold text-[#0A2540]">Стиль решения задач:</span> {personalityAnalysis.problem_solving_style}
                        </p>
                      )}
                      {personalityAnalysis.work_preference && (
                        <p>
                          <span className="font-semibold text-[#0A2540]">Формат работы:</span> {personalityAnalysis.work_preference}
                        </p>
                      )}
                      {personalityAnalysis.growth_areas && (
                        <p>
                          <span className="font-semibold text-[#0A2540]">Зоны развития:</span> {personalityAnalysis.growth_areas}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-[#333333]">Анализ личности еще не выполнен.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#FF7A00]" />
                  Информация по заявке
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[#333333]">
                <div className="flex items-center justify-between">
                  <span>Статус</span>
                  <Badge className={`${statusColor[statusBadge] || 'bg-gray-500'} text-white`}>
                    {statusText[statusBadge] || statusBadge}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Отклик</span>
                  <span>{appliedAt || '—'}</span>
                </div>
                {application.notes && (
                  <div>
                    <p className="text-sm font-semibold text-[#0A2540] mb-1">Заметки</p>
                    <p>{application.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function getInitials(name?: string) {
  if (!name) return 'UA'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatPeriod(entry: any): string {
  if (!entry) return ''
  if (entry.period) return entry.period
  const start = entry.start_date || entry.start || entry.from
  const end = entry.end_date || entry.end || entry.to
  if (start || end) {
    return `${start || '…'} — ${end || 'по н.в.'}`
  }
  if (entry.year) return `${entry.year}`
  return ''
}

function parseList(value?: string | null) {
  if (!value) return []
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function ensureProtocol(url: string) {
  if (!url) return ''
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
}

function formatDate(dateString?: string | null) {
  if (!dateString) return null
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}
