 "use client"

import { SignupForm } from "@/components/signup-form"
import { ArrowRight, Briefcase } from "lucide-react"
import Link from "next/link"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { useI18n } from "@/components/i18n/I18nProvider"

export default function JobSeekerSignupLanding() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white py-10">
      <div className="mx-auto w-full max-w-5xl px-4 flex justify-end pb-4">
        <LanguageSwitcher size="sm" />
      </div>
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 md:grid-cols-2">
        <div className="space-y-6 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <Link href="/" className="text-2xl font-bold text-emerald-900">
            {t("auth.brand")}
          </Link>
          <div>
            <p className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ArrowRight className="mr-1 h-3 w-3" /> {t("auth.signup.employeeSubtitle")}
            </p>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">{t("auth.signup.employeeHeroTitle")}</h1>
            <p className="mt-3 text-base text-gray-600">
              {t("auth.signup.employeeHeroDescription")}
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/80 p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white p-3 text-emerald-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t("auth.signup.includeEmployee.includes")}</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• {t("auth.signup.includeEmployee.bullet1")}</li>
                  <li>• {t("auth.signup.includeEmployee.bullet2")}</li>
                  <li>• {t("auth.signup.includeEmployee.bullet3")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <SignupForm
            initialRole="employee"
            locked
            title={t("auth.signup.employeeFormTitle")}
            description={t("auth.signup.employeeFormDescription")}
          />
        </div>
      </div>
    </div>
  )
}
