import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { AuthProvider } from "@/hooks/use-auth"
import './globals.css'

export const metadata: Metadata = {
  title: 'Unison-AI',
  description: 'Unison-AI platform for AI-powered tools and modules',
  generator: 'Unison-AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}