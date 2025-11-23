import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { AuthProvider } from "@/hooks/use-auth"
import { ToastProvider } from "@/hooks/use-toast"
import { StagewiseToolbarClient } from "@/components/StagewiseToolbarClient"
import { I18nProvider } from "@/components/i18n/I18nProvider"
import { detectLocale } from "@/lib/i18n/server"
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
  const locale = detectLocale()
  // Later, add Stagewise Toolbar plugins here
  const stagewiseConfig = { plugins: [] }
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <I18nProvider initialLocale={locale}>
          <AuthProvider>
            <ToastProvider>
              {children}
              {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_STAGEWISE_ENABLED === 'true' ? (
                <StagewiseToolbarClient config={stagewiseConfig} />
              ) : null}
              <Toaster position="top-right" />
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
