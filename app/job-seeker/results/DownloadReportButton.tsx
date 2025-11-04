"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function DownloadReportButton() {
  const [downloading, setDownloading] = React.useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/productivity/report/pdf', { method: 'GET', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to generate report')
      const buf = await res.arrayBuffer()
      const blob = new Blob([buf], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'productivity-report.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      try {
        // Fallback to opening a new tab (lets browser handle download/view)
        window.open('/api/productivity/report/pdf', '_blank', 'noopener')
      } catch (_) {
        alert('Не удалось скачать PDF-отчет. Пожалуйста, попробуйте еще раз.')
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button onClick={handleDownload} className="w-full bg-[#00C49A] hover:bg-[#00A085]" disabled={downloading}>
      <Download className="w-4 h-4 mr-2" />
      {downloading ? 'Подготовка...' : 'Скачать отчет'}
    </Button>
  )
}


