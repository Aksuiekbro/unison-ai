import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PersonalityTest() {
  const currentStep = 1
  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <Link href="/job-seeker/dashboard" className="text-xl font-bold text-[#0A2540]">
            Unison AI
          </Link>
          <p className="text-[#333333] mt-2">Анализ личности для лучшего подбора вакансий</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-[#333333] mb-2">
                <span>
                  Шаг {currentStep} из {totalSteps}
                </span>
                <span>{Math.round(progress)}% завершено</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#0A2540]">Расскажите о себе</CardTitle>
            <CardDescription className="text-[#333333]">
              Ваши ответы помогут нам лучше понять вашу личность и подобрать идеальные вакансии
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="bg-gradient-to-r from-[#00C49A]/10 to-[#FF7A00]/10 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-[#0A2540] mb-4">
                Опишите ваш самый большой провал и чему он вас научил?
              </h3>
              <p className="text-sm text-[#333333] mb-4">
                Будьте честны и конкретны. Расскажите о ситуации, ваших действиях, результате и выводах, которые вы
                сделали.
              </p>

              <Textarea
                placeholder="Начните писать здесь... Например: 'В моем первом проекте я недооценил сложность задачи и не смог уложиться в дедлайн. Это научило меня...'"
                className="min-h-[200px] border-gray-200 focus:border-[#00C49A] focus:ring-[#00C49A] text-base"
              />
            </div>

            <div className="flex items-center justify-between pt-6">
              <Button
                variant="outline"
                className="flex items-center border-gray-300 text-[#333333] bg-transparent"
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>

              <div className="flex space-x-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${i + 1 <= currentStep ? "bg-[#00C49A]" : "bg-gray-200"}`}
                  />
                ))}
              </div>

              <Button className="flex items-center bg-[#00C49A] hover:bg-[#00A085]">
                Далее
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-[#333333]">Все ваши ответы конфиденциальны и используются только для анализа</p>
        </div>
      </div>
    </div>
  )
}
