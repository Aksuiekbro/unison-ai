import Link from 'next/link'
import { LayoutDashboard, Briefcase, Building2, Settings, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { deleteAccount } from "@/app/actions/account"

export default function EmployerSettings() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <Link href="/" className="text-xl font-bold text-[#0A2540]">
              Unison AI
            </Link>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/employer/dashboard"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Панель
            </Link>
            <Link
              href="/employer/jobs"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Briefcase className="w-5 h-5 mr-3" />
              Вакансии
            </Link>
            <Link
              href="/employer/employees"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Users className="w-5 h-5 mr-3" />
              Сотрудники
            </Link>
            <Link
              href="/employer/company"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Building2 className="w-5 h-5 mr-3" />
              Профиль компании
            </Link>
            <Link
              href="/employer/settings"
              className="flex items-center px-4 py-3 text-[#FF7A00] bg-[#FF7A00]/10 rounded-lg"
            >
              <Settings className="w-5 h-5 mr-3" />
              Настройки
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-[#0A2540] mb-4">Настройки</h1>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-[#0A2540]">Аккаунт</CardTitle>
                  <CardDescription className="text-[#333333]">Управление параметрами аккаунта и компании.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-[#333333] space-y-2">
                    <li>
                      Обновление данных компании выполняется на странице{' '}
                      <Link href="/employer/company" className="text-[#FF7A00] underline">Профиль компании</Link>.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-[#0A2540]">Опасная зона</CardTitle>
                  <CardDescription className="text-red-600">Удаление аккаунта необратимо. Все связанные данные (компания, вакансии, отклики) будут удалены.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Удалить аккаунт</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Это действие нельзя отменить. Ваш аккаунт и связанные данные будут удалены навсегда.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <form action={deleteAccount}>
                          <AlertDialogAction type="submit" className="bg-red-600 hover:bg-red-700">
                            Подтвердить удаление
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


