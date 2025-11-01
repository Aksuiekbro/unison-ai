"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

export default function ShareReportButton({ action }: { action: () => Promise<{ success: boolean; url?: string }> }) {
  const [sharing, setSharing] = React.useState(false)

  const onShare = async () => {
    setSharing(true)
    try {
      const res = await action()
      if (res.success && res.url) {
        await navigator.clipboard.writeText(res.url)
        alert('Ссылка скопирована: ' + res.url)
      } else {
        alert('Не удалось создать ссылку для общего доступа')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <Button
      onClick={onShare}
      variant="outline"
      className="w-full border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00] hover:text-white bg-transparent"
      disabled={sharing}
    >
      <Share2 className="w-4 h-4 mr-2" />
      {sharing ? 'Создание ссылки...' : 'Поделиться'}
    </Button>
  )
}


