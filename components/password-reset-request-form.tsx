"use client"

import { useActionState, useEffect, useState } from "react"
import { requestPasswordResetAction } from "@/app/auth/reset-password/action"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface PasswordResetRequestFormProps {
  submitLabel?: string
  description?: string | null
}

export function PasswordResetRequestForm({ submitLabel = "Send reset link", description = "Enter the email associated with your account and we'll send you reset instructions." }: PasswordResetRequestFormProps) {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, null)
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (state?.success) {
      setEmail("")
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {state?.errors?.email && <p className="mt-1 text-xs text-red-500">{state.errors.email[0]}</p>}
      </div>

      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {state?.message && (
        <div
          className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
            state.success ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {state.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <p>{state.message}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : submitLabel}
      </Button>
    </form>
  )
}
