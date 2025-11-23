 "use client"

import { SignupForm } from "@/components/signup-form"
import { Logotype } from "@/components/logotype"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { useI18n } from "@/components/i18n/I18nProvider"
import Link from "next/link"

export default function SignupPage() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-md items-center justify-between pb-4">
        <div />
        <LanguageSwitcher size="sm" />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-semibold">
            <Logotype className="h-8 w-8" />
            <span>{t("auth.brand")}</span>
          </Link>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
