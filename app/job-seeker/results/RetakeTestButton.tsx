"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { useRouter } from 'next/navigation'

export default function RetakeTestButton() {
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const onRetake = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/productivity/retake', { method: 'POST' })
      if (!res.ok) {
        alert('Не удалось сбросить статус теста')
        return
      }
      router.push('/job-seeker/test')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={onRetake}
      variant="outline"
      className="w-full bg-transparent"
      disabled={loading}
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      {loading ? 'Подготовка...' : 'Пройти тест заново'}
    </Button>
  )
}


