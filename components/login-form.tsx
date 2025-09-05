"use client"

import { useActionState, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { loginAction } from "@/app/auth/login/action"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { refreshAuth } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirectTo') || null

  useEffect(() => {
    if (state?.success) {
      // Ensure browser session is established (fallback in case server action cookies weren't applied)
      if (email && password) {
        await supabase.auth.signInWithPassword({ email, password }).catch(() => {})
      }

      // Refresh auth state and redirect
      refreshAuth().then(() => {
        // If login was triggered by middleware with redirectTo, honor it
        if (redirectTo && redirectTo.startsWith('/')) {
          router.push(redirectTo)
          return
        }

        if (state.role === "employer") {
          router.push("/employer/dashboard")
        } else if (state.role === "job_seeker" || state.role === "job-seeker") {
          router.push("/job-seeker/dashboard")
        } else {
          router.push("/")
        }
      })
    }
  }, [state, refreshAuth, router, redirectTo])

  if (state?.success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl">Success!</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-600">Redirecting you to your dashboard...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            {state?.errors?.email && <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            {state?.errors?.password && <p className="text-xs text-red-500 mt-1">{state.errors.password[0]}</p>}
          </div>

          {state && !state.success && state.message && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <p>{state.message}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">{/* Remember me checkbox can go here */}</div>
            <Link href="#" className="text-sm font-medium text-purple-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Logging in..." : "Login"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-purple-600 hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}