"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Briefcase, Building2, Users, Settings } from "lucide-react"

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
}

interface EmployerSidebarProps {
  companyName?: string
  translations: {
    dashboard: string
    manageJobs: string
    employees: string
    companyProfile: string
    settings: string
    placeholderCompany: string
  }
}

export function EmployerSidebar({ companyName, translations }: EmployerSidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { href: "/employer/dashboard", icon: LayoutDashboard, label: translations.dashboard },
    { href: "/employer/jobs", icon: Briefcase, label: translations.manageJobs },
    { href: "/employer/employees", icon: Users, label: translations.employees },
    { href: "/employer/company", icon: Building2, label: translations.companyProfile },
    { href: "/employer/settings", icon: Settings, label: translations.settings },
  ]

  return (
    <div className="w-64 bg-white shadow-sm border-r flex-shrink-0">
      <div className="p-6">
        <Link href="/" className="text-xl font-bold text-[#0A2540]">
          Unison AI
        </Link>
        <p className="text-sm text-[#333333] mt-1">
          {companyName || translations.placeholderCompany}
        </p>
      </div>
      <nav className="px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/employer/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "text-[#FF7A00] bg-[#FF7A00]/10"
                  : "text-[#333333] hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
