"use server"

import { z } from "zod"
import { supabase } from "@/lib/supabase-client"

const requestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

type ResetState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function requestPasswordResetAction(prevState: ResetState | null, formData: FormData): Promise<ResetState> {
  const email = formData.get("email")
  const parsed = requestSchema.safeParse({ email })

  if (!parsed.success) {
    return {
      success: false,
      message: "We couldn't process your request.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?type=recovery`
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo })

  if (error) {
    console.error("Password reset request failed", error)
  }

  return {
    success: true,
    message: "If an account exists for that email, we've sent instructions to reset your password.",
  }
}
