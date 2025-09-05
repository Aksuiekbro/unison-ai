import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, User, Search, Settings, Heart, Bell, Shield, Eye } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function JobSeekerSettings() {
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
              <Button className="bg-[#00C49A] hover:bg-[#00A085]">Сохранить изменения</Button>
            </div>

            <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="account">Аккаунт</TabsTrigger>
                <TabsTrigger value="notifications">Уведомления</TabsTrigger>
                <TabsTrigger value="privacy">Приватность</TabsTrigger>
                <TabsTrigger value="preferences">Предпочтения</TabsTrigger>
                <TabsTrigger value="security">Безопасность</TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540] flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Настройки аккаунта
                    </CardTitle>
                    <CardDescription>Управляйте основной информацией вашего аккаунта</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Имя</Label>
                        <Input id="firstName" defaultValue="Иван" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Фамилия</Label>
                        <Input id="lastName" defaultValue="Иванов" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="ivan@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input id="phone" defaultValue="+7 (999) 123-45-67" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Часовой пояс</Label>
                      <Select defaultValue="moscow">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="moscow">Москва (UTC+3)</SelectItem>
                          <SelectItem value="spb">Санкт-Петербург (UTC+3)</SelectItem>
                          <SelectItem value="ekb">Екатеринбург (UTC+5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540] flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Уведомления
                    </CardTitle>
                    <CardDescription>Настройте, какие уведомления вы хотите получать</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">Email уведомления</h4>
                        <p className="text-sm text-[#333333]">Получать уведомления на email</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">Новые вакансии</h4>
                        <p className="text-sm text-[#333333]">Уведомления о подходящих вакансиях</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">Отклики на резюме</h4>
                        <p className="text-sm text-[#333333]">Уведомления об откликах работодателей</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">Приглашения на интервью</h4>
                        <p className="text-sm text-[#333333]">Уведомления о приглашениях на собеседования</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">Маркетинговые рассылки</h4>
                        <p className="text-sm text-[#333333]">Новости и советы по поиску работы</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540] flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      Приватность
                    </CardTitle>
                    <CardDescription>Контролируйте видимость вашего профиля</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">Публичный профиль</h4>
                        <p className="text-sm text-[#333333]">Разрешить работодателям находить ваш профиль</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">Показывать контакты</h4>
                        <p className="text-sm text-[#333333]">Отображать контактную информацию в профиле</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">История поиска</h4>
                        <p className="text-sm text-[#333333]">Сохранять историю поисковых запросов</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">Аналитика профиля</h4>
                        <p className="text-sm text-[#333333]">Разрешить сбор данных для улучшения сервиса</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540]">Предпочтения поиска</CardTitle>
                    <CardDescription>Настройте параметры поиска вакансий по умолчанию</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="preferredLocation">Предпочитаемый город</Label>
                        <Select defaultValue="moscow">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="moscow">Москва</SelectItem>
                            <SelectItem value="spb">Санкт-Петербург</SelectItem>
                            <SelectItem value="kazan">Казань</SelectItem>
                            <SelectItem value="remote">Удаленно</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employmentType">Тип занятости</Label>
                        <Select defaultValue="fulltime">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fulltime">Полная занятость</SelectItem>
                            <SelectItem value="parttime">Частичная занятость</SelectItem>
                            <SelectItem value="contract">Контракт</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minSalary">Минимальная зарплата (₽)</Label>
                        <Input id="minSalary" placeholder="150000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experienceLevel">Уровень опыта</Label>
                        <Select defaultValue="middle">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="junior">Junior</SelectItem>
                            <SelectItem value="middle">Middle</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="lead">Lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0A2540]">Удаленная работа</h4>
                        <p className="text-sm text-[#333333]">Показывать только удаленные вакансии</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#0A2540] flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Безопасность
                    </CardTitle>
                    <CardDescription>Управляйте безопасностью вашего аккаунта</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Текущий пароль</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Новый пароль</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button className="bg-[#FF7A00] hover:bg-[#E66A00]">Изменить пароль</Button>

                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#0A2540]">Двухфакторная аутентификация</h4>
                          <p className="text-sm text-[#333333]">Дополнительная защита вашего аккаунта</p>
                        </div>
                        <Switch />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium text-[#0A2540] mb-4">Активные сессии</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-[#0A2540]">Текущая сессия</p>
                            <p className="text-sm text-[#333333]">Chrome на Windows • Москва</p>
                          </div>
                          <Badge className="bg-green-500 text-white">Активна</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <Button variant="destructive" className="bg-red-500 hover:bg-red-600">
                        Удалить аккаунт
                      </Button>
                      <p className="text-sm text-[#333333] mt-2">
                        Это действие нельзя отменить. Все ваши данные будут удалены.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
