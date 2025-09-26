import Link from 'next/link'
import { LayoutDashboard, Briefcase, Building2, Settings } from 'lucide-react'

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
              <div className="rounded-lg border bg-white p-6">
                <h2 className="text-xl font-semibold text-[#0A2540] mb-2">Аккаунт</h2>
                <p className="text-[#333333]">Управление параметрами аккаунта и компании.</p>
                <ul className="list-disc pl-5 mt-3 text-[#333333] space-y-2">
                  <li>
                    Обновление данных компании выполняется на странице{' '}
                    <Link href="/employer/company" className="text-[#FF7A00] underline">Профиль компании</Link>.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


