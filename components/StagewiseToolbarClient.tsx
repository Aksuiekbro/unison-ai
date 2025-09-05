"use client"

import dynamic from "next/dynamic"

interface StagewiseConfig {
  plugins: any[]
}

const StagewiseToolbar = dynamic(async () => {
  const mod = await import("@stagewise/toolbar-next")
  return mod.StagewiseToolbar
}, { ssr: false })

export function StagewiseToolbarClient({ config }: { config: StagewiseConfig }) {
  return <StagewiseToolbar config={config} />
}


