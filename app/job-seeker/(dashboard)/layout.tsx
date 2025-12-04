import { Suspense } from "react"
import { JobSeekerSidebar } from "@/components/dashboard/job-seeker-sidebar"
import { createServerTranslator } from "@/lib/i18n/server"

// Skeleton for main content area
function ContentSkeleton() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-8 w-64"></div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-48"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-32"></div>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = await createServerTranslator()

  const sidebarTranslations = {
    dashboard: t('dashboardNav.dashboard'),
    profile: t('dashboardNav.profile'),
    browseJobs: t('dashboardNav.browseJobs'),
    savedJobs: t('dashboardNav.savedJobs'),
    settings: t('dashboardNav.settings'),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <JobSeekerSidebar translations={sidebarTranslations} />
        <Suspense fallback={<ContentSkeleton />}>
          {children}
        </Suspense>
      </div>
    </div>
  )
}
