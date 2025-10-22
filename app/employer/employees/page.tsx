import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { LayoutDashboard, Briefcase, Building2, Settings, Users } from 'lucide-react'
import type { Database } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabaseAdmin } from '@/lib/supabase-admin'

export default async function EmployerEmployeesPage() {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Authentication required</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch job seekers and their Gemini analysis using the service client (server-side only)
  const { data: employees, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, location, current_job_title, skills, created_at')
    .eq('role', 'job_seeker')
    .order('created_at', { ascending: false })
    .limit(50)

  const ids = (employees || []).map((e: any) => e.id)
  const { data: analyses } = ids.length
    ? await supabaseAdmin
        .from('personality_analysis')
        .select('user_id, analytical_score, creative_score, leadership_score, teamwork_score, ai_confidence_score')
        .in('user_id', ids)
    : { data: [] as any[] }

  const analysisByUser = new Map<string, any>((analyses || []).map((a: any) => [a.user_id, a]))

  const getComposite = (a: any): number | null => {
    const scores = [a?.analytical_score, a?.creative_score, a?.leadership_score, a?.teamwork_score]
      .filter((v: any) => typeof v === 'number') as number[]
    return scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <Link href="/" className="text-xl font-bold text-[#0A2540]">
              Unison AI
            </Link>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/employer/dashboard"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Дашборд
            </Link>
            <Link
              href="/employer/jobs"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Briefcase className="w-5 h-5 mr-3" />
              Вакансии
            </Link>
            <Link
              href="/employer/employees"
              className="flex items-center px-4 py-3 text-[#FF7A00] bg-[#FF7A00]/10 rounded-lg"
            >
              <Users className="w-5 h-5 mr-3" />
              Сотрудники
            </Link>
            <Link
              href="/employer/company"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Building2 className="w-5 h-5 mr-3" />
              Профиль компании
            </Link>
            <Link
              href="/employer/settings"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5 mr-3" />
              Настройки
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#0A2540]">Сотрудники</h1>
              <p className="text-[#333333] mt-1">Просмотр соискателей на платформе</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Список</CardTitle>
                <CardDescription>Показаны последние {employees?.length || 0} соискателей</CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-red-600">Ошибка загрузки: {error.message}</div>
                ) : (
                  <div className="divide-y">
                    {(employees || []).map((e) => {
                      const a = analysisByUser.get((e as any).id)
                      const composite = getComposite(a)
                      return (
                        <div key={(e as any).id} className="py-4 flex items-start justify-between">
                          <div>
                            <div className="font-medium text-[#0A2540]">{(e as any).full_name || (e as any).email}</div>
                            <div className="text-sm text-[#333333]">
                              {(e as any).current_job_title ? `${(e as any).current_job_title} • ` : ''}{(e as any).location || 'Локация не указана'}
                            </div>
                            {/* Gemini score badges */}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {a ? (
                                <>
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-xs text-blue-700">A {a.analytical_score ?? '—'}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-green-50 text-xs text-green-700">C {a.creative_score ?? '—'}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-xs text-purple-700">L {a.leadership_score ?? '—'}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-xs text-amber-700">T {a.teamwork_score ?? '—'}</span>
                                </>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600">Нет оценки</span>
                              )}
                              {Array.isArray((e as any).skills) && (e as any).skills.length > 0 ? (
                                ((e as any).skills as any[]).slice(0, 4).map((s, idx) => (
                                  <span key={`skill-${idx}`} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-[#333333]">
                                    {typeof s === 'string' ? s : (s?.name || 'Навык')}
                                  </span>
                                ))
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right min-w-[96px]">
                            {composite != null ? (
                              <div className="text-sm font-semibold text-[#0A2540]">{composite}%</div>
                            ) : null}
                            <div className="text-xs text-[#333333] whitespace-nowrap mt-1">
                              {new Date((e as any).created_at as any).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                        </div>
                      )
                    })}
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


