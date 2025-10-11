"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

interface StagewiseConfig {
  plugins: any[]
}

const StagewiseToolbar = dynamic(async () => {
  const mod = await import("@stagewise/toolbar-next")
  return mod.StagewiseToolbar
}, { ssr: false })

export function StagewiseToolbarClient({ config }: { config: StagewiseConfig }) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith('/auth')
  // Avoid initializing toolbar on auth pages to prevent sandbox and local service errors
  if (isAuthRoute) return null
  return <StagewiseToolbar config={config} />
}


