"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, User, Search, Settings, Heart } from "lucide-react"

interface NavItem {
  href: string
  icon: React.ElementType
  labelKey: string
  label: string
}

interface JobSeekerSidebarProps {
  translations: {
    dashboard: string
    profile: string
    browseJobs: string
    savedJobs: string
    settings: string
  }
}

export function JobSeekerSidebar({ translations }: JobSeekerSidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { href: "/job-seeker/dashboard", icon: LayoutDashboard, labelKey: "dashboard", label: translations.dashboard },
    { href: "/job-seeker/profile", icon: User, labelKey: "profile", label: translations.profile },
    { href: "/job-seeker/search", icon: Search, labelKey: "browseJobs", label: translations.browseJobs },
    { href: "/job-seeker/saved", icon: Heart, labelKey: "savedJobs", label: translations.savedJobs },
    { href: "/job-seeker/settings", icon: Settings, labelKey: "settings", label: translations.settings },
  ]

  return (
    <div className="w-64 bg-white shadow-sm border-r flex-shrink-0">
      <div className="p-6">
        <Link href="/" className="text-xl font-bold text-[#0A2540]">
          Unison AI
        </Link>
      </div>
      <nav className="px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/job-seeker/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "text-[#00C49A] bg-[#00C49A]/10"
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
