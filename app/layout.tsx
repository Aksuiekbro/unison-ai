import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { AuthProvider } from "@/hooks/use-auth"
import { ToastProvider } from "@/hooks/use-toast"
import { StagewiseToolbarClient } from "@/components/StagewiseToolbarClient"
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
  // Later, add Stagewise Toolbar plugins here
  const stagewiseConfig = { plugins: [] }
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
            {process.env.NODE_ENV === 'development' ? (
              <StagewiseToolbarClient config={stagewiseConfig} />
            ) : null}
            <Toaster position="top-right" />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}