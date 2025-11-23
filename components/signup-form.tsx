"use client"

import { useActionState, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, User, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { signupAction } from "@/app/auth/signup/action"
import { useI18n } from "@/components/i18n/I18nProvider"

type Role = "employer" | "employee"

interface SignupFormProps {
  initialRole?: Role
  locked?: boolean
  title?: string
  description?: string
}

export function SignupForm({ initialRole = "employer", locked = false, title = "Create an account", description = "Choose your role to get started with UnisonAI." }: SignupFormProps) {
  const [state, formAction, isPending] = useActionState(signupAction, null)
  const [role, setRole] = useState<Role>(initialRole)
  const [email, setEmail] = useState("")
  const { t } = useI18n()

  useEffect(() => {
    setRole(initialRole)
  }, [initialRole])

  const employerFields = (
    <>
      <div>
        <Label htmlFor="companyName">{t("auth.common.companyName")}</Label>
        <Input id="companyName" name="companyName" placeholder="Your Company Inc." required />
      </div>
      <div>
        <Label htmlFor="fullName">{t("auth.common.fullName")}</Label>
        <Input id="fullName" name="fullName" placeholder="John Doe" required />
        {state?.errors?.fullName && <p className="text-xs text-red-500 mt-1">{state.errors.fullName[0]}</p>}
      </div>
    </>
  )

  const employeeFields = (
    <div>
      <Label htmlFor="fullName">{t("auth.common.fullName")}</Label>
      <Input id="fullName" name="fullName" placeholder="Jane Smith" required />
      {state?.errors?.fullName && <p className="text-xs text-red-500 mt-1">{state.errors.fullName[0]}</p>}
    </div>
  )

  if (state?.success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl">{t("auth.signup.verifyTitle")}</CardTitle>
          <CardDescription>
            {t("auth.signup.verifyDescription", { email: email || t("auth.common.email") })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-gray-600 space-y-3">
            <p>{t("auth.login.redirecting")}</p>
            <Link href="/auth/login" className="inline-block">
              <Button className="w-full">{t("auth.signup.verifyCta")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title || t("auth.signup.title")}</CardTitle>
        <CardDescription>{description || t("auth.signup.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value={role} />
          <div className="mb-6 grid grid-cols-2 gap-4">
            {[{ id: "employer" as Role, label: t("auth.signup.employer"), Icon: Building2 }, { id: "employee" as Role, label: t("auth.signup.employee"), Icon: User }].map(({ id, label, Icon }) => {
              const isSelected = role === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => !locked && setRole(id)}
                  disabled={locked}
                  className={cn(
                    "relative rounded-lg border-2 p-4 text-center transition-all",
                    locked ? "cursor-not-allowed opacity-90" : "cursor-pointer hover:bg-gray-50",
                    isSelected ? "border-purple-500 bg-purple-50" : "border-gray-200",
                  )}
                >
                  {isSelected && <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-purple-600" />}
                  <Icon className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                  <p className="font-semibold">{label}</p>
                  {locked && isSelected && <p className="mt-1 text-xs text-purple-600">{t("auth.signup.preselected")}</p>}
                </button>
              )
            })}
          </div>

          {role === "employer" ? employerFields : employeeFields}
          <div>
            <Label htmlFor="email">{t("auth.common.email")}</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            {state?.errors?.email && <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>}
          </div>
          <div>
            <Label htmlFor="password">{t("auth.common.password")}</Label>
            <Input id="password" name="password" type="password" required />
            {state?.errors?.password && <p className="text-xs text-red-500 mt-1">{state.errors.password[0]}</p>}
          </div>

          {state && !state.success && state.message && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <p>{state.message}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("auth.signup.creating") : t("auth.signup.submit")}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          {t("auth.signup.alreadyHave")}{" "}
          <Link href="/auth/login" className="font-medium text-purple-600 hover:underline">
            {t("auth.signup.loginCta")}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
