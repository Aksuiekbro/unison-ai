"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function DownloadReportButton() {
  const [downloading, setDownloading] = React.useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')
      const container = document.getElementById('report-root') || document.body
      const canvas = await html2canvas(container as HTMLElement, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let y = 0
      let remaining = imgHeight
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, y ? 0 : 0, imgWidth, imgHeight)
        remaining -= pageHeight
        if (remaining > 0) pdf.addPage()
        y += pageHeight
      }
      pdf.save('productivity-report.pdf')
    } catch (_) {
      // no-op
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


