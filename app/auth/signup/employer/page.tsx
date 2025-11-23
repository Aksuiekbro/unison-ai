 "use client"

import { SignupForm } from "@/components/signup-form"
import { Building2, Sparkles } from "lucide-react"
import Link from "next/link"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { useI18n } from "@/components/i18n/I18nProvider"

export default function EmployerSignupLanding() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-10">
      <div className="mx-auto w-full max-w-5xl px-4 flex justify-end pb-4">
        <LanguageSwitcher size="sm" />
      </div>
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 md:grid-cols-2">
        <div className="space-y-6 rounded-3xl border border-purple-100 bg-white/80 p-8 shadow-sm">
          <Link href="/" className="text-2xl font-bold text-purple-900">
            {t("auth.brand")}
          </Link>
          <div>
            <p className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
              <Sparkles className="mr-1 h-3 w-3" /> {t("auth.signup.employerSubtitle")}
            </p>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">{t("auth.signup.employerHeroTitle")}</h1>
            <p className="mt-3 text-base text-gray-600">
              {t("auth.signup.employerHeroDescription")}
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/80 p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white p-3 text-purple-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t("auth.signup.includeEmployer.includes")}</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• {t("auth.signup.includeEmployer.bullet1")}</li>
                  <li>• {t("auth.signup.includeEmployer.bullet2")}</li>
                  <li>• {t("auth.signup.includeEmployer.bullet3")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <SignupForm
            initialRole="employer"
            locked
            title={t("auth.signup.employerFormTitle")}
            description={t("auth.signup.employerFormDescription")}
          />
        </div>
      </div>
    </div>
  )
}
