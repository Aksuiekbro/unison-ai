import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function JobSeekerRegister() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#0A2540]">
            Unison AI
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-[#0A2540]">Создать профиль соискателя</CardTitle>
            <CardDescription className="text-[#333333]">Начните поиск идеальной работы</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#333333] font-medium">
                  Имя
                </Label>
                <Input
                  id="name"
                  placeholder="Введите ваше имя"
                  className="border-gray-200 focus:border-[#00C49A] focus:ring-[#00C49A]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#333333] font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="border-gray-200 focus:border-[#00C49A] focus:ring-[#00C49A]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#333333] font-medium">
                  Пароль
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="border-gray-200 focus:border-[#00C49A] focus:ring-[#00C49A]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-[#333333] font-medium">
                  Подтвердите пароль
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  className="border-gray-200 focus:border-[#00C49A] focus:ring-[#00C49A]"
                />
              </div>
            </div>

            <Button className="w-full bg-[#00C49A] hover:bg-[#00A085] text-white font-semibold py-3">
              Зарегистрироваться
            </Button>

            <div className="text-center">
              <Link href="/auth/login" className="text-sm text-[#333333] hover:text-[#00C49A]">
                Уже есть аккаунт? Войти
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
