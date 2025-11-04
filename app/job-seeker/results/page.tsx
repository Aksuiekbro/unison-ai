import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, GraduationCap, User, FileText, AlertCircle, Star } from "lucide-react"
import Link from "next/link"
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getProductivityAssessmentData } from '@/actions/productivity-assessment'
import React from 'react'
import { headers, cookies } from 'next/headers'
import DownloadReportButton from './DownloadReportButton'
import RetakeTestButton from './RetakeTestButton'
import ShareReportButton from './ShareReportButton'

export default async function ProductivityResults() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login?redirectTo=/job-seeker/results')
  }

  // Check if user has completed the assessment
  const { data: userData } = await supabase
    .from('users')
    .select('productivity_assessment_completed')
    .eq('id', user.id)
    .single()

  if (!userData?.productivity_assessment_completed) {
    redirect('/job-seeker/test')
  }

  // Get productivity assessment data
  const assessmentData = await getProductivityAssessmentData()

  if (!assessmentData.success || !assessmentData.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Оценка в обработке</h1>
          <p className="text-gray-600 mb-4">
            Ваши результаты оценки продуктивности еще обрабатываются. Пожалуйста, попробуйте позже.
          </p>
          <Link href="/job-seeker/dashboard" className="text-blue-600 hover:underline">
            Вернуться в дашборд
          </Link>
        </div>
      </div>
    )
  }

  const { workExperiences, knowledgeAssessment, productivityAssessment } = assessmentData.data

  async function createShareLink() {
    'use server'
    const hdrs = headers()
    const origin = hdrs.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const cookie = cookies().toString()
    const url = new URL('/api/productivity/share', origin).toString()
    const res = await fetch(url, {
      method: 'POST',
      headers: { cookie },
      cache: 'no-store',
    })
    if (!res.ok) return { success: false }
    const data = await res.json()
    return { success: data.success, url: data.url }
  }

  // Fetch AI personality analysis trait scores (if available)
  const { data: personalityAnalysis } = await supabase
    .from('personality_analysis')
    .select('trait_scores, analytical_score, creative_score, leadership_score, teamwork_score')
    .eq('user_id', user.id)
    .single()

  const traitScores = (personalityAnalysis?.trait_scores as Record<string, number> | null) || null

  const getMotivationLevel = (level: number | null) => {
    switch (level) {
      case 1: return { label: "Деньги", color: "bg-red-500" }
      case 2: return { label: "Личная выгода", color: "bg-orange-500" }
      case 3: return { label: "Личная убежденность", color: "bg-green-500" }
      case 4: return { label: "Долг", color: "bg-blue-500" }
      default: return { label: "Не указано", color: "bg-gray-500" }
    }
  }

  const motivationData = getMotivationLevel(productivityAssessment?.motivation_level)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/job-seeker/dashboard" className="text-2xl font-bold text-[#0A2540]">
            Unison AI
          </Link>
          <h1 className="text-xl font-semibold text-[#333333] mt-2">
            Результаты оценки продуктивности
          </h1>
          <p className="text-[#333333] mt-1">Productivity Assessment Results</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Assessment */}
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-[#0A2540]">Общая оценка продуктивности</CardTitle>
                <CardDescription className="text-lg">На основе анализа опыта работы и компетенций</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-[#00C49A] to-[#FF7A00] text-white text-4xl font-bold mb-4">
                    {productivityAssessment?.overall_productivity_score != null
                      ? `${productivityAssessment.overall_productivity_score}%`
                      : 'N/A'}
                  </div>
                  <p className="text-[#333333] text-lg">
                    Общий показатель продуктивности
                  </p>
                  {productivityAssessment?.role_type && (
                    <Badge className="mt-2 capitalize" variant="outline">
                      {productivityAssessment.role_type === 'manager' ? 'Руководитель' : 'Специалист'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-[#0A2540]">
                  <Building className="w-6 h-6 mr-2" />
                  Опыт работы
                </CardTitle>
                <CardDescription>Ваша профессиональная история и достижения</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {workExperiences.map((exp) => (
                    <div key={exp.id} className="border-l-4 border-[#00C49A] pl-6 pb-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-[#0A2540]">{exp.position}</h4>
                          <p className="text-[#333333] font-medium">{exp.company_name}</p>
                          {exp.work_duration && (
                            <p className="text-sm text-gray-600">{exp.work_duration}</p>
                          )}
                        </div>
                        {exp.team_comparison_score && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{exp.team_comparison_score}/5</span>
                          </div>
                        )}
                      </div>

                      {exp.work_products && (
                        <div className="mb-3">
                          <h5 className="font-medium text-[#0A2540] mb-1">Продукт работы:</h5>
                          <p className="text-sm text-[#333333]">{exp.work_products}</p>
                        </div>
                      )}

                      {exp.key_achievements && (
                        <div className="mb-3">
                          <h5 className="font-medium text-[#0A2540] mb-1">Ключевые достижения:</h5>
                          <p className="text-sm text-[#333333]">{exp.key_achievements}</p>
                        </div>
                      )}

                      {exp.result_measurement && (
                        <div>
                          <h5 className="font-medium text-[#0A2540] mb-1">Методы измерения результатов:</h5>
                          <p className="text-sm text-[#333333]">{exp.result_measurement}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Assessment */}
            {knowledgeAssessment && (
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0A2540]">
                    <GraduationCap className="w-6 h-6 mr-2" />
                    Знания и компетенции
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {knowledgeAssessment.recent_learning_activities && (
                      <div>
                        <h5 className="font-medium text-[#0A2540] mb-2">Недавнее обучение:</h5>
                        <p className="text-sm text-[#333333] bg-gray-50 p-3 rounded-lg">
                          {knowledgeAssessment.recent_learning_activities}
                        </p>
                      </div>
                    )}

                    {knowledgeAssessment.professional_development && (
                      <div>
                        <h5 className="font-medium text-[#0A2540] mb-2">Профессиональные навыки:</h5>
                        <p className="text-sm text-[#333333] bg-gray-50 p-3 rounded-lg">
                          {knowledgeAssessment.professional_development}
                        </p>
                      </div>
                    )}

                    {knowledgeAssessment.future_learning_goals && (
                      <div>
                        <h5 className="font-medium text-[#0A2540] mb-2">Планы обучения:</h5>
                        <p className="text-sm text-[#333333] bg-gray-50 p-3 rounded-lg">
                          {knowledgeAssessment.future_learning_goals}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Personality Traits (AI) */}
            {traitScores && (
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-[#0A2540]">Личностные черты (ИИ)</CardTitle>
                  <CardDescription>Оценка по шкале 1–100</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(traitScores)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([trait, score]) => (
                      <div key={trait} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <span className="capitalize text-sm text-[#0A2540]">
                          {trait.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="secondary">{Math.round(Number(score))}</Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Motivation Level */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Уровень мотивации</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center space-x-3 p-4 rounded-lg ${motivationData.color} text-white`}>
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                  <span className="font-medium">{motivationData.label}</span>
                </div>
              </CardContent>
            </Card>

            {/* Test Scores */}
            {(productivityAssessment?.iq_test_score || productivityAssessment?.personality_test_score || productivityAssessment?.leadership_test_score) && (
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-[#0A2540]">Результаты тестов</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {productivityAssessment.iq_test_score && (
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-[#0A2540]">IQ Test</span>
                      <Badge variant="secondary">{productivityAssessment.iq_test_score}</Badge>
                    </div>
                  )}

                  {productivityAssessment.personality_test_score && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-[#0A2540]">Тест восприятия</span>
                      <Badge variant="secondary">{productivityAssessment.personality_test_score}</Badge>
                    </div>
                  )}

                  {productivityAssessment.leadership_test_score && (
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium text-[#0A2540]">Тест лидерства</span>
                      <Badge variant="secondary">{productivityAssessment.leadership_test_score}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Personal Information */}
            {productivityAssessment && (
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0A2540]">
                    <User className="w-5 h-5 mr-2" />
                    Дополнительная информация
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {productivityAssessment.citizenship && (
                    <div>
                      <span className="text-sm font-medium text-[#0A2540]">Гражданство:</span>
                      <p className="text-sm text-[#333333]">{productivityAssessment.citizenship}</p>
                    </div>
                  )}

                  {productivityAssessment.family_status && (
                    <div>
                      <span className="text-sm font-medium text-[#0A2540]">Семейное положение:</span>
                      <p className="text-sm text-[#333333]">{productivityAssessment.family_status}</p>
                    </div>
                  )}

                  {productivityAssessment.minimum_salary_requirement && (
                    <div>
                      <span className="text-sm font-medium text-[#0A2540]">Зарплатные ожидания:</span>
                      <p className="text-sm text-[#333333]">
                        {productivityAssessment.minimum_salary_requirement.toLocaleString()} ₸
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Assessment Notes */}
            {productivityAssessment?.assessor_notes && (
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0A2540]">
                    <FileText className="w-5 h-5 mr-2" />
                    Заметки оценщика
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#333333] leading-relaxed">
                    {productivityAssessment.assessor_notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Probation Recommendation */}
            {productivityAssessment?.probation_recommendation && (
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-[#0A2540]">Рекомендация</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-3 rounded-lg text-center ${
                    productivityAssessment.probation_recommendation === 'yes'
                      ? 'bg-green-50 text-green-700'
                      : productivityAssessment.probation_recommendation === 'no'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <span className="font-medium">
                      {productivityAssessment.probation_recommendation === 'yes' && 'Рекомендуется к найму'}
                      {productivityAssessment.probation_recommendation === 'no' && 'Не рекомендуется'}
                      {productivityAssessment.probation_recommendation === 'never_consider' && 'Не рассматривать'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DownloadReportButton />
                <ShareReportButton action={createShareLink} />
                <RetakeTestButton />
                <Link href="/job-seeker/search" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    Найти подходящие вакансии
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}