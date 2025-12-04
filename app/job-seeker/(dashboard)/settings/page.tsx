import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import Link from "next/link"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { deleteAccount } from "@/app/actions/account"

export default async function JobSeekerSettings() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#0A2540]">Настройки</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A2540] flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile settings moved
            </CardTitle>
            <CardDescription>
              Personal information is now managed on the <Link href="/job-seeker/profile" className="text-[#00C49A] underline">Profile</Link> page to avoid duplicates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[#333333]">Use your profile to update name, title, summary, contacts and links.</p>
          </CardContent>
        </Card>

        <Card className="mt-8 border-red-200">
          <CardHeader>
            <CardTitle className="text-[#0A2540]">Опасная зона</CardTitle>
            <CardDescription className="text-red-600">Удаление аккаунта необратимо. Все ваши данные, включая профиль, сохраненные вакансии и отклики, будут удалены.</CardDescription>
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
                    Это действие нельзя отменить. Ваш аккаунт и все связанные данные будут удалены навсегда.
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
  )
}
