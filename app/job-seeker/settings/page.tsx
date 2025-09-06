import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LayoutDashboard, User, Search, Settings, Heart } from "lucide-react"
import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"
import { updateBasicProfile } from "@/app/actions/profile"

export default async function JobSeekerSettings() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  let firstName = ""
  let lastName = ""
  let email = ""
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name,last_name,email')
      .eq('id', user.id as any)
      .maybeSingle()
    firstName = (profile as any)?.first_name || ""
    lastName = (profile as any)?.last_name || ""
    email = (profile as any)?.email || user.email || ""
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <Link href="/" className="text-xl font-bold text-[#0A2540]">
              Unison AI
            </Link>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/job-seeker/dashboard"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Дашборд
            </Link>
            <Link
              href="/job-seeker/profile"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <User className="w-5 h-5 mr-3" />
              Мой профиль
            </Link>
            <Link
              href="/job-seeker/search"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Search className="w-5 h-5 mr-3" />
              Поиск вакансий
            </Link>
            <Link
              href="/job-seeker/saved"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Heart className="w-5 h-5 mr-3" />
              Избранное
            </Link>
            <Link
              href="/job-seeker/settings"
              className="flex items-center px-4 py-3 text-[#00C49A] bg-[#00C49A]/10 rounded-lg"
            >
              <Settings className="w-5 h-5 mr-3" />
              Настройки
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-[#0A2540]">Настройки</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A2540] flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Аккаунт
                </CardTitle>
                <CardDescription>Основная информация профиля</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={async (formData) => { 'use server'; await updateBasicProfile(formData) }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Имя</Label>
                      <Input id="firstName" name="firstName" defaultValue={firstName} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Фамилия</Label>
                      <Input id="lastName" name="lastName" defaultValue={lastName} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={email} disabled />
                  </div>
                  <Button type="submit" className="bg-[#00C49A] hover:bg-[#00A085]">Сохранить</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
