import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServerTranslator } from '@/lib/i18n/server'

export default async function SharedReportPage({ params }: { params: { token: string } }) {
  const token = params.token
  if (!token) return notFound()
  const { t } = await createServerTranslator()

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
            <CardTitle className="text-[#0A2540]">{t('share.report.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[#333333] space-y-2">
              <div>
                {t('share.report.overall')}: <b>{assessment.overall_productivity_score ?? t('common.data.none')}%</b>
              </div>
              <div>
                {t('share.report.roleType')}: {assessment.role_type ?? t('common.data.none')}
              </div>
              <div>
                {t('share.report.motivation')}: {assessment.motivation_level ?? t('common.data.none')}
              </div>
            </div>
          </CardContent>
        </Card>

        {!!workExperiences?.length && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-[#0A2540]">{t('share.report.workTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workExperiences.map((exp: any) => (
                <div key={exp.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{exp.company_name} — {exp.position}</div>
                  <div className="text-sm text-gray-600">
                    {exp.start_date} — {exp.end_date || t('share.report.workDates.present')}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {knowledge && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-[#0A2540]">{t('share.report.knowledgeTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-[#333333] whitespace-pre-wrap">
                {knowledge.professional_development ||
                  knowledge.recent_learning_activities ||
                  knowledge.future_learning_goals ||
                  t('common.data.none')}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

