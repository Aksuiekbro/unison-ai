"use client"

import { useActionState, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, User, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { signupAction } from "@/app/auth/signup/action"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

type Role = "employer" | "employee"

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, null)
  const [role, setRole] = useState<Role>("employer")
  const { refreshAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      // For signup, we might want to redirect to a verification page first
      // or to the login page if email verification is required
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    }
  }, [state, router])

  const employerFields = (
    <>
      <div>
        <Label htmlFor="companyName">Company Name</Label>
        <Input id="companyName" name="companyName" placeholder="Your Company Inc." required />
      </div>
      <div>
        <Label htmlFor="fullName">Your Full Name</Label>
        <Input id="fullName" name="fullName" placeholder="John Doe" required />
        {state?.errors?.fullName && <p className="text-xs text-red-500 mt-1">{state.errors.fullName[0]}</p>}
      </div>
    </>
  )

  const employeeFields = (
    <div>
      <Label htmlFor="fullName">Full Name</Label>
      <Input id="fullName" name="fullName" placeholder="Jane Smith" required />
      {state?.errors?.fullName && <p className="text-xs text-red-500 mt-1">{state.errors.fullName[0]}</p>}
    </div>
  )

  if (state?.success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl">Success!</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-600">
            Redirecting you to the login page...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Choose your role to get started with UnisonAI.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value={role} />
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div
              onClick={() => setRole("employer")}
              className={cn(
                "relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:bg-gray-50",
                role === "employer" ? "border-purple-500 bg-purple-50" : "border-gray-200",
              )}
            >
              {role === "employer" && <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-purple-600" />}
              <Building2 className="mx-auto mb-2 h-8 w-8 text-gray-600" />
              <p className="font-semibold">Employer</p>
            </div>
            <div
              onClick={() => setRole("employee")}
              className={cn(
                "relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:bg-gray-50",
                role === "employee" ? "border-purple-500 bg-purple-50" : "border-gray-200",
              )}
            >
              {role === "employee" && <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-purple-600" />}
              <User className="mx-auto mb-2 h-8 w-8 text-gray-600" />
              <p className="font-semibold">Job Seeker</p>
            </div>
          </div>

          {role === "employer" ? employerFields : employeeFields}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state?.errors?.email && <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
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
            {isPending ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-purple-600 hover:underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}