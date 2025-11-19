import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Brain, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import type { Database } from '@/lib/database.types'

const TRAIT_LABELS: Record<string, string> = {
  adaptability: 'Адаптивность',
  empathy: 'Эмпатия',
  resilience: 'Устойчивость',
  ownership: 'Ответственность',
  strategic_thinking: 'Стратегия',
  collaboration: 'Сотрудничество',
  focus: 'Фокус',
  creativity: 'Креативность',
  communication: 'Коммуникация',
}

const CORE_SCORES: { key: 'analytical_score' | 'creative_score' | 'leadership_score' | 'teamwork_score'; label: string; helper: string }[] = [
  { key: 'analytical_score', label: 'Аналитика', helper: 'Способность работать с данными и структурировать задачи' },
  { key: 'creative_score', label: 'Креативность', helper: 'Поиск нестандартных решений и инноваций' },
  { key: 'leadership_score', label: 'Лидерство', helper: 'Умение вдохновлять и вести команду' },
  { key: 'teamwork_score', label: 'Командность', helper: 'Сотрудничество и поддержка коллег' },
]

const NARRATIVE_SECTIONS: { label: string; key: keyof Pick<Database['public']['Tables']['personality_analysis']['Row'], 'problem_solving_style' | 'initiative_level' | 'work_preference' | 'motivational_factors' | 'communication_style' | 'leadership_potential' | 'growth_areas'> }[] = [
  { label: 'Стиль решения задач', key: 'problem_solving_style' },
  { label: 'Инициативность', key: 'initiative_level' },
  { label: 'Предпочитаемый формат работы', key: 'work_preference' },
  { label: 'Что мотивирует', key: 'motivational_factors' },
  { label: 'Коммуникация', key: 'communication_style' },
  { label: 'Лидерский потенциал', key: 'leadership_potential' },
  { label: 'Зоны роста', key: 'growth_areas' },
]


export default async function PersonalityResultsPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login?redirectTo=/job-seeker/results')
  }

  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('personality_assessment_completed')
    .eq('id', user.id)
    .single()

  if (userError) {
    console.warn('Failed to load personality assessment completion flag', userError)
  }

  if (!userRecord?.personality_assessment_completed) {
    redirect('/job-seeker/test')
  }

  const { data: analysis, error: analysisError } = await supabase
    .from('personality_analysis')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (analysisError) {
    console.warn('Failed to fetch personality analysis', analysisError)
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-2xl bg-white/80 p-10 text-center shadow-lg">
          <AlertCircle className="mb-6 h-16 w-16 text-amber-500" />
          <h1 className="text-2xl font-semibold text-[#0A2540]">Анализ еще готовится</h1>
          <p className="mt-3 text-gray-600">
            Ваши ответы успешно отправлены. Как только ИИ завершит обработку, результаты появятся здесь автоматически.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/job-seeker/test">Проверить ответы</Link>
            </Button>
            <Button asChild>
              <Link href="/job-seeker/dashboard">Вернуться в дашборд</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const traitEntries = Object.entries((analysis.trait_scores || {}) as Record<string, number>)
    .filter(([, value]) => typeof value === 'number')
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 6)

  const updatedAt = analysis.updated_at || analysis.created_at
  const confidencePercent = analysis.ai_confidence_score != null
    ? Math.round(analysis.ai_confidence_score * 100)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="text-center">
          <Link href="/job-seeker/dashboard" className="text-2xl font-bold text-[#0A2540]">
            Unison AI
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-[#333333]">Профиль личности</h1>
          <p className="text-sm text-gray-600">Персональный отчет на основе ваших ответов</p>
        </header>

        <Card className="border-0 shadow-xl">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-3xl text-[#0A2540]">
                <Brain className="h-10 w-10 text-[#00C49A]" />
                Ваш профиль личности
              </CardTitle>
              <CardDescription className="mt-2 text-base text-gray-600">
                Основные выводы ИИ о ваших сильных сторонах и стиле работы
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {confidencePercent != null && (
                <Badge variant="secondary" className="bg-[#0A2540] text-white hover:bg-[#0A2540]/90">
                  Уверенность ИИ: {confidencePercent}%
                </Badge>
              )}
              {updatedAt && (
                <Badge variant="outline">
                  Обновлено: {new Date(updatedAt).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {analysis.work_preference && (
                <Badge variant="outline" className="flex items-center gap-1 border-[#00C49A]/30 text-[#00C49A]">
                  <Sparkles className="h-4 w-4" />
                  {analysis.work_preference}
                </Badge>
              )}
              {analysis.problem_solving_style && (
                <Badge variant="outline">{analysis.problem_solving_style}</Badge>
              )}
            </div>
            <p className="text-base leading-relaxed text-[#333333]">
              {analysis.motivational_factors || 'Мы используем ваши ответы, чтобы подобрать вакансии и команды, где вы сможете раскрыть потенциал.'}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Ключевые характеристики</CardTitle>
              <CardDescription>Сводка по основным аспектам вашего поведения и мотивации</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NARRATIVE_SECTIONS.map(({ label, key }) => {
                const value = analysis[key]
                if (!value) return null
                return (
                  <div key={key} className="rounded-lg border border-slate-100 bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 text-sm text-[#0A2540]">{value}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Оценки компетенций</CardTitle>
              <CardDescription>ИИ оценивает силу проявления каждого навыка (0-100)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {CORE_SCORES.map(({ key, label, helper }) => {
                const rawValue = analysis[key]
                const value = typeof rawValue === 'number' ? rawValue : null
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-sm font-medium text-[#0A2540]">
                      <span>{label}</span>
                      <span>{value != null ? `${value}%` : '—'}</span>
                    </div>
                    <Progress value={value ?? 0} />
                    <p className="mt-1 text-xs text-gray-500">{helper}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {traitEntries.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Дополнительные грани личности</CardTitle>
              <CardDescription>Топ-6 характеристик, которые выделил ИИ</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {traitEntries.map(([trait, value]) => (
                <div key={trait} className="rounded-xl border border-slate-100 bg-white/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0A2540]">
                      {TRAIT_LABELS[trait] || trait.replace(/_/g, ' ')}
                    </p>
                    <Badge variant="secondary">{value}%</Badge>
                  </div>
                  <Progress className="mt-3" value={value} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-[#0A2540]">Следующие шаги</CardTitle>
              <CardDescription>Используйте результаты, чтобы искать вакансии с идеальным совпадением</CardDescription>
            </div>
            <Button asChild>
              <Link href="/job-seeker/search" className="flex items-center gap-2">
                Найти подходящие вакансии
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-gray-600">
              <p className="font-medium text-[#0A2540]">Советы по использованию отчета</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Обновите резюме, добавив сильные стороны из отчета</li>
                <li>Подготовьте примеры под каждую компетенцию для интервью</li>
              </ul>
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-gray-600">
              <p className="font-medium text-[#0A2540]">Что видят работодатели</p>
              <p className="mt-2">
                Ваш профиль доступен работодателям вместе с оценкой совместимости, поэтому завершенный тест повышает доверие и скорость отклика.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
