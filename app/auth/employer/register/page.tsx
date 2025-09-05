import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export default function EmployerRegister() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block">
          <div className="text-center p-8">
            <Building2 className="w-32 h-32 text-[#FF7A00] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-[#0A2540] mb-4">Растите вместе с лучшими талантами</h2>
            <p className="text-[#333333] text-lg">
              Находите идеальных кандидатов с помощью ИИ-анализа личности и навыков
            </p>
          </div>
        </div>

        <div>
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-[#0A2540]">
              Unison AI
            </Link>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-[#0A2540]">Регистрация компании</CardTitle>
              <CardDescription className="text-[#333333]">Начните поиск лучших кандидатов</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-[#333333] font-medium">
                    Название компании
                  </Label>
                  <Input
                    id="company"
                    placeholder="ООО 'Ваша компания'"
                    className="border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#333333] font-medium">
                    Ваше имя
                  </Label>
                  <Input
                    id="name"
                    placeholder="Иван Иванов"
                    className="border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#333333] font-medium">
                    Рабочий email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hr@company.com"
                    className="border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#333333] font-medium">
                    Пароль
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    className="border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                  />
                </div>
              </div>

              <Button className="w-full bg-[#FF7A00] hover:bg-[#E66A00] text-white font-semibold py-3">
                Создать аккаунт компании
              </Button>

              <div className="text-center">
                <Link href="/auth/login" className="text-sm text-[#333333] hover:text-[#FF7A00]">
                  Уже зарегистрированы? Войти
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
