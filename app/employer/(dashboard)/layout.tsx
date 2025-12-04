import { Suspense } from "react"
import { EmployerSidebar } from "@/components/dashboard/employer-sidebar"
import { createServerTranslator } from "@/lib/i18n/server"

// Skeleton for main content area
function ContentSkeleton() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-8 w-64"></div>
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-48"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = await createServerTranslator()

  const sidebarTranslations = {
    dashboard: t('dashboardNav.dashboard'),
    manageJobs: t('dashboardNav.manageJobs'),
    employees: t('dashboardNav.employees'),
    companyProfile: t('dashboardNav.companyProfile'),
    settings: t('dashboardNav.settings'),
    placeholderCompany: t('employer.sidebar.placeholderCompany'),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <EmployerSidebar translations={sidebarTranslations} />
        <Suspense fallback={<ContentSkeleton />}>
          {children}
        </Suspense>
      </div>
    </div>
  )
}
