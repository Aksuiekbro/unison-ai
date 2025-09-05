import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  Download,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  Users,
  Brain,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

export default function CandidateProfile() {
  const candidate = {
    name: "Алексей Петров",
    avatar: "/placeholder.svg?height=80&width=80",
    title: "Senior Frontend Developer",
    location: "Москва",
    email: "alexey.petrov@email.com",
    phone: "+7 (999) 123-45-67",
    experience: "5 лет",
    matchScore: 92,
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "Docker", "AWS"],
    summary:
      "Опытный фронтенд-разработчик с 5-летним стажем в создании современных веб-приложений. Специализируюсь на React и TypeScript, имею опыт работы с микросервисной архитектурой и облачными технологиями.",
    experience_details: [
      {
        position: "Senior Frontend Developer",
        company: "TechStart",
        period: "2022 - настоящее время",
        description:
          "Разработка и поддержка крупного SaaS-продукта на React/TypeScript. Руководство командой из 3 разработчиков, внедрение best practices и code review процессов.",
      },
      {
        position: "Frontend Developer",
        company: "WebStudio",
        period: "2020 - 2022",
        description:
          "Создание интерактивных веб-приложений для e-commerce. Оптимизация производительности, интеграция с REST API и GraphQL.",
      },
    ],
    education: [
      {
        degree: "Бакалавр",
        field: "Информатика и вычислительная техника",
        institution: "МГУ им. М.В. Ломоносова",
        year: "2019",
      },
    ],
    aiAnalysis: {
      problemSolving: 88,
      initiative: 92,
      teamwork: 85,
      adaptability: 90,
      culturalFit: 87,
      summary:
        "Кандидат демонстрирует высокий уровень технических навыков и лидерских качеств. Аналитический склад ума и проактивный подход к решению задач делают его идеальным для senior-позиций. Хорошо работает в команде, но также способен принимать самостоятельные решения.",
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/employer/jobs/1/candidates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />К списку кандидатов
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540]">Профиль кандидата</h1>
            <p className="text-[#333333] mt-1">Детальный анализ и резюме</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={candidate.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {candidate.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#0A2540] mb-2">{candidate.name}</h2>
                    <p className="text-lg text-[#333333] mb-3">{candidate.title}</p>
                    <div className="flex items-center space-x-6 text-sm text-[#333333]">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {candidate.location}
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {candidate.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {candidate.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button className="bg-[#00C49A] hover:bg-[#00A085]">
                      <Calendar className="w-4 h-4 mr-2" />
                      Запланировать интервью
                    </Button>
                    <Button variant="outline" className="border-[#FF7A00] text-[#FF7A00] bg-transparent">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Написать
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">О кандидате</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#333333] leading-relaxed">{candidate.summary}</p>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540] flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Опыт работы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {candidate.experience_details.map((exp, index) => (
                    <div key={index} className="relative">
                      {index !== candidate.experience_details.length - 1 && (
                        <div className="absolute left-4 top-8 w-px h-16 bg-gray-200"></div>
                      )}
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#0A2540]">{exp.position}</h4>
                          <p className="text-[#333333] font-medium">{exp.company}</p>
                          <p className="text-sm text-gray-500 mb-2">{exp.period}</p>
                          <p className="text-sm text-[#333333] leading-relaxed">{exp.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540] flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Образование
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.education.map((edu, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#00C49A] rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0A2540]">{edu.degree}</h4>
                      <p className="text-[#333333]">{edu.field}</p>
                      <p className="text-sm text-gray-500">
                        {edu.institution} • {edu.year}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Навыки и технологии</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Sidebar */}
          <div className="space-y-6">
            {/* Match Score */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-[#0A2540]">Match Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#FF7A00"
                      strokeWidth="2"
                      strokeDasharray={`${candidate.matchScore}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-[#FF7A00]">{candidate.matchScore}</span>
                  </div>
                </div>
                <p className="text-[#333333]">Отличное соответствие позиции</p>
              </CardContent>
            </Card>

            {/* AI Analysis Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">ИИ-анализ личности</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-[#FF7A00]" />
                      <span className="text-sm">Решение проблем</span>
                    </div>
                    <span className="text-sm font-medium">{candidate.aiAnalysis.problemSolving}%</span>
                  </div>
                  <Progress value={candidate.aiAnalysis.problemSolving} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-[#00C49A]" />
                      <span className="text-sm">Инициативность</span>
                    </div>
                    <span className="text-sm font-medium">{candidate.aiAnalysis.initiative}%</span>
                  </div>
                  <Progress value={candidate.aiAnalysis.initiative} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-[#0A2540]" />
                      <span className="text-sm">Командная работа</span>
                    </div>
                    <span className="text-sm font-medium">{candidate.aiAnalysis.teamwork}%</span>
                  </div>
                  <Progress value={candidate.aiAnalysis.teamwork} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-[#FF7A00]" />
                      <span className="text-sm">Адаптивность</span>
                    </div>
                    <span className="text-sm font-medium">{candidate.aiAnalysis.adaptability}%</span>
                  </div>
                  <Progress value={candidate.aiAnalysis.adaptability} className="h-2" />
                </div>

                <Separator />

                <div className="bg-gradient-to-r from-[#00C49A]/10 to-[#FF7A00]/10 p-4 rounded-lg">
                  <h4 className="font-semibold text-[#0A2540] mb-2">
                    Культурное соответствие: {candidate.aiAnalysis.culturalFit}%
                  </h4>
                  <p className="text-sm text-[#333333] leading-relaxed">{candidate.aiAnalysis.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540]">Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-[#00C49A] hover:bg-[#00A085]">Сделать предложение</Button>
                <Button className="w-full bg-[#FF7A00] hover:bg-[#E66A00]">
                  <Calendar className="w-4 h-4 mr-2" />
                  Запланировать интервью
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Скачать резюме
                </Button>
                <Button variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-50 bg-transparent">
                  Отклонить кандидата
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
