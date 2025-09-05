import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Target, Users, Lightbulb, TrendingUp, Heart, Download, Share2 } from "lucide-react"
import Link from "next/link"

export default function PersonalityResults() {
  const personalityTraits = [
    { name: "Аналитическое мышление", score: 85, icon: Brain, color: "bg-blue-500" },
    { name: "Командная работа", score: 78, icon: Users, color: "bg-green-500" },
    { name: "Инициативность", score: 92, icon: Target, color: "bg-purple-500" },
    { name: "Креативность", score: 71, icon: Lightbulb, color: "bg-yellow-500" },
    { name: "Адаптивность", score: 88, icon: TrendingUp, color: "bg-orange-500" },
    { name: "Эмпатия", score: 76, icon: Heart, color: "bg-pink-500" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/job-seeker/dashboard" className="text-2xl font-bold text-[#0A2540]">
            Unison AI
          </Link>
          <p className="text-[#333333] mt-2">Результаты анализа личности</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score */}
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-[#0A2540]">Ваши сильные стороны</CardTitle>
                <CardDescription className="text-lg">Анализ на основе ваших ответов и опыта</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-[#00C49A] to-[#FF7A00] text-white text-4xl font-bold mb-4">
                    82%
                  </div>
                  <p className="text-[#333333] text-lg">Общий показатель соответствия IT-сфере</p>
                </div>
              </CardContent>
            </Card>

            {/* Personality Traits */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Детальный анализ личности</CardTitle>
                <CardDescription>Ваши ключевые характеристики и их влияние на работу</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {personalityTraits.map((trait) => {
                    const Icon = trait.icon
                    return (
                      <div key={trait.name} className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${trait.color} text-white`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#0A2540]">{trait.name}</h4>
                            <div className="flex items-center space-x-2">
                              <Progress value={trait.score} className="flex-1 h-2" />
                              <span className="text-sm font-medium text-[#333333]">{trait.score}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Problem Solving Style */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Стиль решения проблем</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-[#00C49A]/10 to-[#FF7A00]/10 p-6 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Brain className="w-8 h-8 text-[#00C49A]" />
                    <h3 className="text-xl font-semibold text-[#0A2540]">Аналитический подход</h3>
                  </div>
                  <p className="text-[#333333] leading-relaxed">
                    Вы предпочитаете тщательно анализировать проблемы, собирать данные и принимать взвешенные решения.
                    Ваш подход к решению задач основан на логике и фактах, что делает вас ценным специалистом в
                    технических проектах.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Work Style */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Предпочтительный стиль работы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-[#00C49A]/10 rounded-lg">
                  <Users className="w-6 h-6 text-[#00C49A]" />
                  <span className="font-medium text-[#0A2540]">Командный игрок</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                  <Target className="w-6 h-6 text-gray-500" />
                  <span className="text-[#333333]">Независимый специалист</span>
                </div>
              </CardContent>
            </Card>

            {/* Motivational Factors */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Мотивационные факторы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className="w-full justify-center py-2 bg-[#00C49A] text-white">Профессиональный рост</Badge>
                  <Badge className="w-full justify-center py-2 bg-[#FF7A00] text-white">Интересные задачи</Badge>
                  <Badge className="w-full justify-center py-2 bg-[#0A2540] text-white">Командная работа</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-[#00C49A] hover:bg-[#00A085]">
                  <Download className="w-4 h-4 mr-2" />
                  Скачать отчет
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00] hover:text-white bg-transparent"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Поделиться
                </Button>
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
