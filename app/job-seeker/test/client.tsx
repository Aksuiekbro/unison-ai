"use client"

import { useRouter } from 'next/navigation'
import { PersonalityTest } from '@/components/personality-test'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, ShieldCheck, Sparkles } from 'lucide-react'

interface PersonalityAssessmentClientProps {
  userId: string
}

export default function PersonalityAssessmentClient({ userId }: PersonalityAssessmentClientProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#00C49A]/10 text-[#00C49A]">
              <Brain className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-semibold text-[#0A2540]">
              Тест личности с ИИ
            </CardTitle>
            <p className="text-muted-foreground">
              Ответьте на 7 открытых вопросов, чтобы получить персональный профиль сильных сторон.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <Badge variant="secondary" className="flex items-center gap-1 bg-[#0A2540] text-white hover:bg-[#0A2540]/90">
                <Sparkles className="h-4 w-4" />
                AI-анализ за минуты
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                Конфиденциально
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-gray-600 md:grid-cols-2">
            <div className="rounded-lg border border-dashed border-slate-200 p-4">
              <p className="font-medium text-[#0A2540]">Советы по ответам</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Давайте конкретные примеры из опыта</li>
                <li>Опишите контекст, действия и результат</li>
                <li>Минимум 50 символов для каждого ответа</li>
              </ul>
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 p-4">
              <p className="font-medium text-[#0A2540]">Что вы получите</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Анализ стиля решения задач, лидерства и мотивации</li>
                <li>Оценка ключевых компетенций (0-100)</li>
                <li>Рекомендации для работодателей</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <PersonalityTest
          userId={userId}
          className="shadow-lg"
          onTestComplete={() => router.push('/job-seeker/results')}
        />
      </div>
    </div>
  )
}
