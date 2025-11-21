"use client"

import { FormEvent, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

type Status = { type: "idle" | "success" | "error"; message?: string }
type ResetResponse = { success: boolean; message: string; errors?: Record<string, string[]> }

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<Status>({ type: "idle" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8) {
      setStatus({ type: "error", message: "Password must be at least 8 characters long." })
      return
    }
    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." })
      return
    }

    setIsSubmitting(true)
    setStatus({ type: "idle" })

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, confirmPassword }),
      })

      const data = (await response.json().catch(() => null)) as ResetResponse | null

      if (!data) {
        setStatus({ type: "error", message: "Unexpected response. Please try again." })
      } else if (data.success) {
        setStatus({ type: "success", message: data.message })
        setPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          router.push("/auth/login")
        }, 2500)
      } else {
        setStatus({ type: "error", message: data.message })
      }
    } catch (error) {
      console.error("Password update request failed", error)
      setStatus({ type: "error", message: "Unable to update password right now. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">Use at least 8 characters.</p>
      </div>
      <div>
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      {status.type !== "idle" && status.message && (
        <div
          className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
            status.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {status.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <p>{status.message}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={() => router.push("/auth/login")}>
        Back to login
      </Button>
    </form>
  )
}
