"use client"

import { useState, useActionState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus, Building, GraduationCap, User, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { submitProductivityAssessment } from '@/actions/productivity-assessment'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from 'sonner'

interface WorkExperience {
  id: string
  company_name: string
  company_activities: string
  position: string
  start_date: string
  end_date: string
  is_current: boolean
  work_duration: string
  reason_for_leaving: string
  functions_performed: string
  work_products: string
  result_measurement: string
  product_timeline: string
  team_comparison_score: number
  workload_change_over_time: string
  responsibility_evolution: string
  key_achievements: string
}

export default function ProductivityAssessmentClient() {
  const [currentTab, setCurrentTab] = useState("work-experience")
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([
    {
      id: '1',
      company_name: '',
      company_activities: '',
      position: '',
      start_date: '',
      end_date: '',
      is_current: false,
      work_duration: '',
      reason_for_leaving: '',
      functions_performed: '',
      work_products: '',
      result_measurement: '',
      product_timeline: '',
      team_comparison_score: 3,
      workload_change_over_time: '',
      responsibility_evolution: '',
      key_achievements: ''
    }
  ])

  const router = useRouter()

  // Draft state for non-work tabs
  const [knowledge, setKnowledge] = useState({
    recent_learning_activities: "",
    professional_development: "",
    future_learning_goals: "",
  })

  const [personal, setPersonal] = useState({
    citizenship: "",
    residence_location: "",
    family_status: "",
    has_children: "",
    living_situation: "",
    actual_address: "",
    financial_obligations: "",
    minimum_salary_requirement: "",
    chronic_illnesses: "",
    legal_issues: "",
  })

  const [assessmentState, setAssessmentState] = useState({
    role_type: "",
    motivation_level: "",
    overall_productivity_score: "",
    iq_test_score: "",
    personality_test_score: "",
    leadership_test_score: "",
    assessor_notes: "",
    probation_recommendation: "",
    planned_start_date: "",
  })

  const [knowledgeId, setKnowledgeId] = useState<string | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const isInitializingRef = useRef(true)
  const knowledgeSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const assessmentSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const cardTopRef = useRef<HTMLDivElement | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(submitProductivityAssessment, {
    success: false,
    message: "",
  })

  // Redirect on successful submission
  useEffect(() => {
    if (state.success) {
      router.push('/job-seeker/results')
    }
  }, [state.success, router])

  // Load existing draft data
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load knowledge draft (latest)
        const { data: knowledgeRows } = await supabase
          .from('knowledge_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (knowledgeRows && knowledgeRows.length > 0) {
          const k = knowledgeRows[0] as any
          setKnowledgeId(k.id)
          setKnowledge({
            recent_learning_activities: k.recent_learning_activities || "",
            professional_development: k.professional_development || "",
            future_learning_goals: k.future_learning_goals || "",
          })
        }

        // Load productivity assessment draft (latest)
        const { data: assessmentRows } = await supabase
          .from('productivity_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (assessmentRows && assessmentRows.length > 0) {
          const a = assessmentRows[0] as any
          setAssessmentId(a.id)
          setPersonal({
            citizenship: a.citizenship || "",
            residence_location: a.residence_location || "",
            family_status: a.family_status || "",
            has_children: typeof a.has_children === 'boolean' ? String(a.has_children) : (a.has_children || ""),
            living_situation: a.living_situation || "",
            actual_address: a.actual_address || "",
            financial_obligations: a.financial_obligations || "",
            minimum_salary_requirement: typeof a.minimum_salary_requirement === 'number' ? String(a.minimum_salary_requirement) : (a.minimum_salary_requirement || ""),
            chronic_illnesses: a.chronic_illnesses || "",
            legal_issues: a.legal_issues || "",
          })
          setAssessmentState({
            role_type: a.role_type || "",
            motivation_level: typeof a.motivation_level === 'number' ? String(a.motivation_level) : (a.motivation_level || ""),
            overall_productivity_score: typeof a.overall_productivity_score === 'number' ? String(a.overall_productivity_score) : (a.overall_productivity_score || ""),
            iq_test_score: typeof a.iq_test_score === 'number' ? String(a.iq_test_score) : (a.iq_test_score || ""),
            personality_test_score: typeof a.personality_test_score === 'number' ? String(a.personality_test_score) : (a.personality_test_score || ""),
            leadership_test_score: typeof a.leadership_test_score === 'number' ? String(a.leadership_test_score) : (a.leadership_test_score || ""),
            assessor_notes: a.assessor_notes || "",
            probation_recommendation: a.probation_recommendation || "",
            planned_start_date: a.planned_start_date || "",
          })
        }
      } finally {
        isInitializingRef.current = false
      }
    })()
  }, [])

  // Autosave knowledge
  useEffect(() => {
    if (isInitializingRef.current) return
    if (knowledgeSaveTimer.current) clearTimeout(knowledgeSaveTimer.current)
    knowledgeSaveTimer.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const payload: any = {
          user_id: user.id,
          recent_learning_activities: knowledge.recent_learning_activities || null,
          professional_development: knowledge.professional_development || null,
          future_learning_goals: knowledge.future_learning_goals || null,
        }
        if (knowledgeId) {
          await supabase.from('knowledge_assessments').update(payload).eq('id', knowledgeId)
        } else {
          const { data: inserted } = await supabase.from('knowledge_assessments').insert(payload).select('id').limit(1)
          if (inserted && inserted[0]) setKnowledgeId((inserted[0] as any).id)
        }
      } catch (_) {}
    }, 500)
  }, [knowledge])

  // Autosave personal + assessment
  useEffect(() => {
    if (isInitializingRef.current) return
    if (assessmentSaveTimer.current) clearTimeout(assessmentSaveTimer.current)
    assessmentSaveTimer.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const payload: any = {
          user_id: user.id,
          citizenship: personal.citizenship || null,
          residence_location: personal.residence_location || null,
          family_status: personal.family_status || null,
          has_children: personal.has_children === '' ? null : personal.has_children === 'true',
          living_situation: personal.living_situation || null,
          actual_address: personal.actual_address || null,
          financial_obligations: personal.financial_obligations || null,
          minimum_salary_requirement: personal.minimum_salary_requirement === '' ? null : Number(personal.minimum_salary_requirement),
          chronic_illnesses: personal.chronic_illnesses || null,
          legal_issues: personal.legal_issues || null,
          role_type: assessmentState.role_type || null,
          motivation_level: assessmentState.motivation_level === '' ? null : Number(assessmentState.motivation_level),
          overall_productivity_score: assessmentState.overall_productivity_score === '' ? null : Number(assessmentState.overall_productivity_score),
          iq_test_score: assessmentState.iq_test_score === '' ? null : Number(assessmentState.iq_test_score),
          personality_test_score: assessmentState.personality_test_score === '' ? null : Number(assessmentState.personality_test_score),
          leadership_test_score: assessmentState.leadership_test_score === '' ? null : Number(assessmentState.leadership_test_score),
          assessor_notes: assessmentState.assessor_notes || null,
          probation_recommendation: assessmentState.probation_recommendation || null,
          planned_start_date: assessmentState.planned_start_date || null,
        }
        if (assessmentId) {
          await supabase.from('productivity_assessments').update(payload).eq('id', assessmentId)
        } else {
          const { data: inserted } = await supabase.from('productivity_assessments').insert(payload).select('id').limit(1)
          if (inserted && inserted[0]) setAssessmentId((inserted[0] as any).id)
        }
      } catch (_) {}
    }, 600)
  }, [personal, assessmentState])

  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
      company_name: '',
      company_activities: '',
      position: '',
      start_date: '',
      end_date: '',
      is_current: false,
      work_duration: '',
      reason_for_leaving: '',
      functions_performed: '',
      work_products: '',
      result_measurement: '',
      product_timeline: '',
      team_comparison_score: 3,
      workload_change_over_time: '',
      responsibility_evolution: '',
      key_achievements: ''
    }
    setWorkExperiences([...workExperiences, newExp])
  }

  const removeWorkExperience = (id: string) => {
    if (workExperiences.length > 1) {
      setWorkExperiences(workExperiences.filter(exp => exp.id !== id))
    }
  }

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: string | number | boolean) => {
    setWorkExperiences(workExperiences.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
  }

  const handleFormSubmit = (formData: FormData) => {
    // Add work experiences to form data
    workExperiences.forEach((exp, index) => {
      Object.entries(exp).forEach(([key, value]) => {
        if (key !== 'id') {
          formData.append(`work_experience_${index}_${key}`, value.toString())
        }
      })
    })

    // Submit using server action
    formAction(formData)
  }

  const tabData = [
    { id: "work-experience", label: "Опыт работы", icon: Building },
    { id: "knowledge", label: "Знания", icon: GraduationCap },
    { id: "personal", label: "Личная информация", icon: User },
    { id: "assessment", label: "Оценка", icon: FileText },
  ]

  const currentTabIndex = tabData.findIndex(tab => tab.id === currentTab)
  const progress = ((currentTabIndex + 1) / tabData.length) * 100

  // Validation helper for required fields per tab
  const validateTab = (tabId: string) => {
    const missing: string[] = []
    if (tabId === 'work-experience') {
      const ok = workExperiences.some(exp =>
        (exp.company_name?.trim() || '') !== '' &&
        (exp.position?.trim() || '') !== '' &&
        (exp.start_date?.trim() || '') !== '' &&
        (exp.functions_performed?.trim() || '') !== ''
      )
      if (!ok) {
        missing.push('Компания', 'Должность', 'Дата начала', 'Функции на должности')
      }
    }
    if (tabId === 'knowledge') {
      if ((knowledge.future_learning_goals?.trim() || '') === '') {
        missing.push('Чему бы хотели обучиться (планы по обучению)')
      }
    }
    if (tabId === 'assessment') {
      if ((assessmentState.role_type?.trim() || '') === '') {
        missing.push('Тип роли')
      }
      if ((assessmentState.motivation_level?.trim() || '') === '') {
        missing.push('Уровень мотивации')
      }
    }
    return { ok: missing.length === 0, missing }
  }

  // Scroll to top on tab change
  useEffect(() => {
    cardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentTab])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div ref={cardTopRef} />
        <div className="text-center mb-8">
          <Link href="/job-seeker/dashboard" className="text-2xl font-bold text-[#0A2540]">
            Unison AI
          </Link>
          <h1 className="text-xl font-semibold text-[#333333] mt-2">
            ПРОВЕРКА ПРОДУКТИВНОСТИ / PRODUCTIVITY CHECK
          </h1>
          <p className="text-[#333333] mt-1">Место работы</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-[#333333] mb-2">
                <span>Шаг {currentTabIndex + 1} из {tabData.length}</span>
                <span>{Math.round(progress)}% завершено</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#0A2540]">
              Оценка продуктивности
            </CardTitle>
            <CardDescription className="text-[#333333]">
              Заполните все разделы для полной оценки ваших профессиональных качеств
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              ref={formRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLElement
                  const tag = target?.tagName
                  const isTextarea = tag === 'TEXTAREA'
                  // Prevent accidental submit via Enter outside textarea on non-final tabs
                  if (!isTextarea && currentTab !== 'assessment') {
                    e.preventDefault()
                  }
                }
              }}
              action={handleFormSubmit}
            >
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  {tabData.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {/* Work Experience Tab */}
                <TabsContent value="work-experience" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#0A2540]">
                      Опыт работы
                    </h3>
                    <Button
                      type="button"
                      onClick={addWorkExperience}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить работу
                    </Button>
                  </div>

                  {workExperiences.map((exp, index) => (
                    <Card key={exp.id} className="p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-[#0A2540]">Место работы №{index + 1}</h4>
                        {workExperiences.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeWorkExperience(exp.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`company_name_${exp.id}`}>Название компании<span className="text-red-500">*</span>:</Label>
                          <Input
                            id={`company_name_${exp.id}`}
                            value={exp.company_name}
                            onChange={(e) => updateWorkExperience(exp.id, 'company_name', e.target.value)}
                            placeholder="Название компании"
                            aria-required="true"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`company_activities_${exp.id}`}>Вид деятельности:</Label>
                          <Input
                            id={`company_activities_${exp.id}`}
                            value={exp.company_activities}
                            onChange={(e) => updateWorkExperience(exp.id, 'company_activities', e.target.value)}
                            placeholder="Описание деятельности"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`position_${exp.id}`}>Должность<span className="text-red-500">*</span>:</Label>
                          <Input
                            id={`position_${exp.id}`}
                            value={exp.position}
                            onChange={(e) => updateWorkExperience(exp.id, 'position', e.target.value)}
                            placeholder="Ваша должность"
                            aria-required="true"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`work_duration_${exp.id}`}>Срок работы в этой должности:</Label>
                          <Input
                            id={`work_duration_${exp.id}`}
                            value={exp.work_duration}
                            onChange={(e) => updateWorkExperience(exp.id, 'work_duration', e.target.value)}
                            placeholder="Например: 2 года 3 месяца"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`start_date_${exp.id}`}>Дата начала<span className="text-red-500">*</span>:</Label>
                          <Input
                            id={`start_date_${exp.id}`}
                            type="date"
                            value={exp.start_date}
                            onChange={(e) => updateWorkExperience(exp.id, 'start_date', e.target.value)}
                            aria-required="true"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`reason_leaving_${exp.id}`}>Причина увольнения:</Label>
                          <Input
                            id={`reason_leaving_${exp.id}`}
                            value={exp.reason_for_leaving}
                            onChange={(e) => updateWorkExperience(exp.id, 'reason_for_leaving', e.target.value)}
                            placeholder="Если применимо"
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <Label htmlFor={`functions_${exp.id}`}>Какие функции Вы выполняли на этой должности?<span className="text-red-500">*</span></Label>
                          <Textarea
                            id={`functions_${exp.id}`}
                            value={exp.functions_performed}
                            onChange={(e) => updateWorkExperience(exp.id, 'functions_performed', e.target.value)}
                            placeholder="Подробно опишите ваши обязанности и функции"
                            className="min-h-[100px]"
                            aria-required="true"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`products_${exp.id}`}>
                            Что являлось продуктом работы на этой должности?
                            <span className="block text-sm text-gray-500 mt-1">
                              (Если сразу не ответил, дайте повторный шанс. За какой конечный результат Вам платили заработную плату?)
                            </span>
                          </Label>
                          <Textarea
                            id={`products_${exp.id}`}
                            value={exp.work_products}
                            onChange={(e) => updateWorkExperience(exp.id, 'work_products', e.target.value)}
                            placeholder="Конкретные результаты вашей работы"
                            className="min-h-[100px]"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`measurement_${exp.id}`}>
                            Как Вы измеряли свои результаты?
                            <span className="block text-sm text-gray-500 mt-1">
                              (На что Вы опирались в своей работе, чтобы понять, все ли хорошо в Вашей области деятельности или нет и по каким критериям ВЫ САМИ оценивали свою эффективность? Какими ЕЩЁ способами можно было измерить сколько продукта Вы произвели?)
                            </span>
                          </Label>
                          <Textarea
                            id={`measurement_${exp.id}`}
                            value={exp.result_measurement}
                            onChange={(e) => updateWorkExperience(exp.id, 'result_measurement', e.target.value)}
                            placeholder="Критерии и методы оценки результатов"
                            className="min-h-[100px]"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`timeline_${exp.id}`}>
                            Сколько Вы производили своего продукта?
                            <span className="block text-sm text-gray-500 mt-1">
                              (Месяц, квартал, год)? (Какой у вас был план? Сколько раз за последние 12 месяцев Вы достигли поставленный план?)
                            </span>
                          </Label>
                          <Textarea
                            id={`timeline_${exp.id}`}
                            value={exp.product_timeline}
                            onChange={(e) => updateWorkExperience(exp.id, 'product_timeline', e.target.value)}
                            placeholder="Временные рамки и планы"
                            className="min-h-[80px]"
                          />
                        </div>

                        <div>
                          <Label>Сколько Вы производили в сравнении с другими сотрудниками?</Label>
                          <p className="text-sm text-gray-500 mb-2">(Не забудьте это уточнить при наведении справок)</p>
                          <RadioGroup
                            value={exp.team_comparison_score.toString()}
                            onValueChange={(value) => updateWorkExperience(exp.id, 'team_comparison_score', parseInt(value))}
                            className="flex space-x-6"
                          >
                            {[1, 2, 3, 4, 5].map(score => (
                              <div key={score} className="flex items-center space-x-2">
                                <RadioGroupItem value={score.toString()} id={`score_${exp.id}_${score}`} />
                                <Label htmlFor={`score_${exp.id}_${score}`}>{score}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        <div>
                          <Label htmlFor={`workload_change_${exp.id}`}>
                            Ваш объем работы как-то менялся с течением времени?
                            <span className="block text-sm text-gray-500 mt-1">
                              (Если да, то как? За счет чего рос объем работы и как это проявлялось?)
                            </span>
                          </Label>
                          <Textarea
                            id={`workload_change_${exp.id}`}
                            value={exp.workload_change_over_time}
                            onChange={(e) => updateWorkExperience(exp.id, 'workload_change_over_time', e.target.value)}
                            placeholder="Изменения в объеме работы"
                            className="min-h-[80px]"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`responsibility_evolution_${exp.id}`}>
                            Ваш круг обязанностей как-то менялся? Он рос или уменьшался?
                            <span className="block text-sm text-gray-500 mt-1">
                              (За счет чего он рос? Какие функции Вам добавляли? Как вы считаете почему именно вам добавляли функционал?)
                            </span>
                          </Label>
                          <Textarea
                            id={`responsibility_evolution_${exp.id}`}
                            value={exp.responsibility_evolution}
                            onChange={(e) => updateWorkExperience(exp.id, 'responsibility_evolution', e.target.value)}
                            placeholder="Эволюция обязанностей"
                            className="min-h-[80px]"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`achievements_${exp.id}`}>
                            Какими достижениями на этой работе Вы гордитесь?
                            <span className="block text-sm text-gray-500 mt-1">
                              (Не забудьте это уточнить при наведении справок)
                            </span>
                          </Label>
                          <Textarea
                            id={`achievements_${exp.id}`}
                            value={exp.key_achievements}
                            onChange={(e) => updateWorkExperience(exp.id, 'key_achievements', e.target.value)}
                            placeholder="Ваши главные достижения"
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                {/* Knowledge Assessment Tab */}
                <TabsContent value="knowledge" className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#0A2540] mb-4">
                    ЗНАНИЯ (КОМПЕТЕНТНОСТЬ)
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="recent_learning">
                        Чему Вы обучились в последнее время?
                        <span className="block text-sm text-gray-500 mt-1">
                          (онлайн, офлайн, тренинги, деловая литература, курсы, прочитанные книги)
                        </span>
                      </Label>
              <Textarea
                        id="recent_learning"
                        name="recent_learning_activities"
                placeholder="Опишите ваше недавнее обучение..."
                value={knowledge.recent_learning_activities}
                onChange={(e) => setKnowledge(v => ({ ...v, recent_learning_activities: e.target.value }))}
                        className="min-h-[120px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="professional_development">
                        Выявить компетентность в профессиональных вопросах/программах. (Умение работать в CRM системе, профессиональные программы, профессиональные умения и навыки)
                      </Label>
              <Textarea
                        id="professional_development"
                        name="professional_development"
                placeholder="Ваши профессиональные навыки и компетенции..."
                value={knowledge.professional_development}
                onChange={(e) => setKnowledge(v => ({ ...v, professional_development: e.target.value }))}
                        className="min-h-[120px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="future_learning">
                        Чему бы Вы хотели обучиться в ближайшее время?<span className="text-red-500">*</span>
                      </Label>
              <Textarea
                        id="future_learning"
                        name="future_learning_goals"
                placeholder="Ваши планы по обучению..."
                value={knowledge.future_learning_goals}
                onChange={(e) => setKnowledge(v => ({ ...v, future_learning_goals: e.target.value }))}
                        className="min-h-[100px]"
                        aria-required="true"
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#0A2540] mb-4">
                    ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="citizenship">Гражданство:</Label>
                      <Input
                        id="citizenship"
                        name="citizenship"
                        placeholder="Ваше гражданство"
                        value={personal.citizenship}
                        onChange={(e) => setPersonal(v => ({ ...v, citizenship: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="residence_location">
                        Место жительства:
                        <span className="block text-sm text-gray-500">(прописка)</span>
                      </Label>
                      <Input
                        id="residence_location"
                        name="residence_location"
                        placeholder="Место прописки"
                        value={personal.residence_location}
                        onChange={(e) => setPersonal(v => ({ ...v, residence_location: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="family_status">Семейное положение:</Label>
                      <Input
                        id="family_status"
                        name="family_status"
                        placeholder="Ваш семейный статус"
                        value={personal.family_status}
                        onChange={(e) => setPersonal(v => ({ ...v, family_status: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <Label>Дети:</Label>
                      <RadioGroup name="has_children" className="flex space-x-4" value={personal.has_children} onValueChange={(v) => setPersonal(p => ({ ...p, has_children: v }))}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="children_yes" />
                          <Label htmlFor="children_yes">Есть</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="children_no" />
                          <Label htmlFor="children_no">Нет</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="living_situation">С кем проживаете:</Label>
                      <Input
                        id="living_situation"
                        name="living_situation"
                        placeholder="С кем живете"
                        value={personal.living_situation}
                        onChange={(e) => setPersonal(v => ({ ...v, living_situation: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actual_address">
                        Адрес проживания:
                        <span className="block text-sm text-gray-500">(фактический адрес)</span>
                      </Label>
                      <Input
                        id="actual_address"
                        name="actual_address"
                        placeholder="Фактический адрес"
                        value={personal.actual_address}
                        onChange={(e) => setPersonal(v => ({ ...v, actual_address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="financial_obligations">Кредиты/ипотека:</Label>
                      <Input
                        id="financial_obligations"
                        name="financial_obligations"
                        placeholder="Финансовые обязательства"
                        value={personal.financial_obligations}
                        onChange={(e) => setPersonal(v => ({ ...v, financial_obligations: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minimum_salary">
                        Минимальные требования по ЗП:
                      </Label>
                      <Input
                        id="minimum_salary"
                        name="minimum_salary_requirement"
                        type="number"
                        placeholder="Минимальная зарплата"
                        value={personal.minimum_salary_requirement}
                        onChange={(e) => setPersonal(v => ({ ...v, minimum_salary_requirement: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="chronic_illnesses">Хронические заболевания:</Label>
                      <Textarea
                        id="chronic_illnesses"
                        name="chronic_illnesses"
                        placeholder="Если имеются"
                        value={personal.chronic_illnesses}
                        onChange={(e) => setPersonal(v => ({ ...v, chronic_illnesses: e.target.value }))}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="legal_issues">Правовые вопросы:</Label>
                      <Textarea
                        id="legal_issues"
                        name="legal_issues"
                        placeholder="Есть ли какие-либо правовые вопросы или ограничения"
                        value={personal.legal_issues}
                        onChange={(e) => setPersonal(v => ({ ...v, legal_issues: e.target.value }))}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Assessment Tab */}
                <TabsContent value="assessment" className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#0A2540] mb-4">
                    ЗАКЛЮЧЕНИЕ ПО КАНДИДАТУ
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <Label>Тип роли<span className="text-red-500">*</span>:</Label>
                      <p className="text-sm text-gray-500 mb-3">
                        Выберите тип позиции, на которую претендуете
                      </p>
                      <RadioGroup name="role_type" className="flex space-x-6" value={assessmentState.role_type} onValueChange={(v) => setAssessmentState(a => ({ ...a, role_type: v }))}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="specialist" id="role_specialist" />
                          <Label htmlFor="role_specialist">Специалист</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manager" id="role_manager" />
                          <Label htmlFor="role_manager">Руководитель</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Уровень мотивации<span className="text-red-500">*</span>:</Label>
                      <p className="text-sm text-gray-500 mb-3">
                        Выберите основной мотивационный фактор
                      </p>
                      <RadioGroup name="motivation_level" className="space-y-2" value={assessmentState.motivation_level} onValueChange={(v) => setAssessmentState(a => ({ ...a, motivation_level: v }))}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id="motivation_money" />
                          <Label htmlFor="motivation_money">Деньги</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="2" id="motivation_benefit" />
                          <Label htmlFor="motivation_benefit">Личная выгода</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="3" id="motivation_conviction" />
                          <Label htmlFor="motivation_conviction">Личная убежденность</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="4" id="motivation_duty" />
                          <Label htmlFor="motivation_duty">Долг</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="overall_score">Общий показатель продуктивности (%):</Label>
                      <Input
                        id="overall_score"
                        name="overall_productivity_score"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        className="max-w-xs"
                        value={assessmentState.overall_productivity_score}
                        onChange={(e) => setAssessmentState(a => ({ ...a, overall_productivity_score: e.target.value }))}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="iq_score">IQ Test:</Label>
                        <Input
                          id="iq_score"
                          name="iq_test_score"
                          type="number"
                          placeholder="Балл"
                          value={assessmentState.iq_test_score}
                          onChange={(e) => setAssessmentState(a => ({ ...a, iq_test_score: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="personality_score">Тест на восприятие:</Label>
                        <Input
                          id="personality_score"
                          name="personality_test_score"
                          type="number"
                          placeholder="Балл"
                          value={assessmentState.personality_test_score}
                          onChange={(e) => setAssessmentState(a => ({ ...a, personality_test_score: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="leadership_score">Тест на лидерство:</Label>
                        <Input
                          id="leadership_score"
                          name="leadership_test_score"
                          type="number"
                          placeholder="Балл"
                          value={assessmentState.leadership_test_score}
                          onChange={(e) => setAssessmentState(a => ({ ...a, leadership_test_score: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="assessor_notes">Дополнение по кандидату:</Label>
                      <Textarea
                        id="assessor_notes"
                        name="assessor_notes"
                        placeholder="Дополнительные заметки об оценке..."
                        value={assessmentState.assessor_notes}
                        onChange={(e) => setAssessmentState(a => ({ ...a, assessor_notes: e.target.value }))}
                        className="min-h-[120px]"
                      />
                    </div>

                    <div>
                      <Label>Приглашение на испытательный срок:</Label>
                      <RadioGroup name="probation_recommendation" className="flex space-x-6 mt-2" value={assessmentState.probation_recommendation} onValueChange={(v) => setAssessmentState(a => ({ ...a, probation_recommendation: v }))}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="probation_yes" />
                          <Label htmlFor="probation_yes">Да</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="probation_no" />
                          <Label htmlFor="probation_no">Нет</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="never_consider" id="probation_never" />
                          <Label htmlFor="probation_never">Больше никогда не рассматривать</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="start_date">Дата выхода на стажировку:</Label>
                      <Input
                        id="start_date"
                        name="planned_start_date"
                        type="date"
                        className="max-w-xs"
                        value={assessmentState.planned_start_date}
                        onChange={(e) => setAssessmentState(a => ({ ...a, planned_start_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                {state.message && (
                  <div className={`p-4 rounded-lg ${
                    state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {state.message}
                  </div>
                )}

                <div className="flex items-center justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const currentIndex = tabData.findIndex(tab => tab.id === currentTab)
                      if (currentIndex > 0) {
                        setCurrentTab(tabData[currentIndex - 1].id)
                      }
                    }}
                    disabled={currentTabIndex === 0 || isPending}
                  >
                    Назад
                  </Button>

                  {currentTab === "assessment" ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        className="bg-[#00C49A] hover:bg-[#00A085]"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Сохранение...
                          </>
                        ) : (
                          "Завершить оценку"
                        )}
                      </Button>
                      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Подтвердите завершение</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-[#333333]">
                            Проверьте, что заполнили все разделы. Вы уверены, что хотите завершить оценку?
                          </p>
                          <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setConfirmOpen(false)}>Отмена</Button>
                            <Button
                              type="button"
                              onClick={() => {
                                const hasRequiredExperience = workExperiences.some(exp =>
                                  (exp.company_name?.trim() || '') !== '' &&
                                  (exp.position?.trim() || '') !== '' &&
                                  (exp.start_date?.trim() || '') !== '' &&
                                  (exp.functions_performed?.trim() || '') !== ''
                                )
                                if (!hasRequiredExperience) {
                                  toast.error('Добавьте минимум одно место работы: Компания, Должность, Дата начала и Функции')
                                  setCurrentTab('work-experience')
                                  setConfirmOpen(false)
                                  return
                                }
                                if ((knowledge.future_learning_goals?.trim() || '') === '') {
                                  toast.error('Заполните: Чему бы Вы хотели обучиться (планы по обучению)')
                                  setCurrentTab('knowledge')
                                  setConfirmOpen(false)
                                  return
                                }
                                if ((assessmentState.role_type?.trim() || '') === '' || (assessmentState.motivation_level?.trim() || '') === '') {
                                  const parts = []
                                  if ((assessmentState.role_type?.trim() || '') === '') parts.push('Тип роли')
                                  if ((assessmentState.motivation_level?.trim() || '') === '') parts.push('Уровень мотивации')
                                  toast.error(`Заполните: ${parts.join(', ')}`)
                                  setCurrentTab('assessment')
                                  setConfirmOpen(false)
                                  return
                                }
                                setConfirmOpen(false)
                                formRef.current?.requestSubmit()
                              }}
                              className="bg-[#00C49A] hover:bg-[#00A085]"
                            >
                              Подтвердить
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => {
                        const { ok, missing } = validateTab(currentTab)
                        if (!ok) {
                          toast.error(`Заполните обязательные поля: ${missing.join(', ')}`)
                          return
                        }
                        const currentIndex = tabData.findIndex(tab => tab.id === currentTab)
                        if (currentIndex < tabData.length - 1) {
                          setCurrentTab(tabData[currentIndex + 1].id)
                        }
                      }}
                      className="bg-[#00C49A] hover:bg-[#00A085]"
                      disabled={isPending}
                    >
                      Далее
                    </Button>
                  )}
                </div>
              </Tabs>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-[#333333]">
            Все данные конфиденциальны и используются только для оценки продуктивности
          </p>
        </div>
      </div>
    </div>
  )
}