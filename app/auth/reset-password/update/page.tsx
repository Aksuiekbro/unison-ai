 "use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UpdatePasswordForm } from "@/components/update-password-form"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { useI18n } from "@/components/i18n/I18nProvider"

export default function CompletePasswordResetPage() {
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
            <CardTitle className="text-2xl">{t("auth.resetUpdate.title")}</CardTitle>
            <CardDescription>{t("auth.resetUpdate.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdatePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
