 "use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordResetRequestForm } from "@/components/password-reset-request-form"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { useI18n } from "@/components/i18n/I18nProvider"
import Link from "next/link"

export default function ResetPasswordPage() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-md items-center justify-between pb-4">
        <div />
        <LanguageSwitcher size="sm" />
      </div>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.resetRequest.title")}</CardTitle>
            <CardDescription>{t("auth.resetRequest.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordResetRequestForm submitLabel={t("auth.resetRequest.submit")} description={t("auth.resetRequest.formDescription")} />
            <div className="mt-4 text-center text-sm">
              {t("auth.resetRequest.remembered")}{" "}
              <Link href="/auth/login" className="font-medium text-purple-600 hover:underline">
                {t("auth.resetRequest.returnToLogin")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
