import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SharedReportPage({ params }: { params: { token: string } }) {
  const token = params.token
  if (!token) return notFound()

  const { data: shared } = await supabaseAdmin
    .from('shared_reports')
    .select('user_id, assessment_id, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!shared) return notFound()
  if (new Date(shared.expires_at) < new Date()) return notFound()

  const [{ data: assessment }, { data: workExperiences }, { data: knowledge }] = await Promise.all([
    supabaseAdmin
      .from('productivity_assessments')
      .select('*')
      .eq('id', shared.assessment_id)
      .maybeSingle(),
    supabaseAdmin
      .from('work_experiences')
      .select('*')
      .eq('user_id', shared.user_id)
      .order('start_date', { ascending: false }),
    supabaseAdmin
      .from('knowledge_assessments')
      .select('*')
      .eq('user_id', shared.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!assessment) return notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4" id="report-root">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-[#0A2540]">Оценка продуктивности (общий доступ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[#333333] space-y-2">
              <div>Общий показатель: <b>{assessment.overall_productivity_score ?? '—'}%</b></div>
              <div>Тип роли: {assessment.role_type ?? '—'}</div>
              <div>Уровень мотивации: {assessment.motivation_level ?? '—'}</div>
            </div>
          </CardContent>
        </Card>

        {!!workExperiences?.length && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Опыт работы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workExperiences.map((exp: any) => (
                <div key={exp.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{exp.company_name} — {exp.position}</div>
                  <div className="text-sm text-gray-600">{exp.start_date} — {exp.end_date || 'По наст.'}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {knowledge && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-[#0A2540]">Знания</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-[#333333] whitespace-pre-wrap">
                {knowledge.professional_development || knowledge.recent_learning_activities || knowledge.future_learning_goals || '—'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


