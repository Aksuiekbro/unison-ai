import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"
import { supabase } from "@/lib/supabase-client"

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (typeof data.confirmPassword === "string" && data.confirmPassword.length > 0 && data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      })
    }
  })

export type PasswordResetResult = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function sendPasswordResetEmail(email: string): Promise<PasswordResetResult> {
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?type=recovery`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    console.error("Password reset request failed", error)
  }

  return {
    success: true,
    message: "If an account exists for that email, we've sent instructions to reset your password.",
  }
}

export async function updatePassword(client: SupabaseClient<Database>, password: string): Promise<PasswordResetResult> {
  const { error } = await client.auth.updateUser({ password })

  if (error) {
    console.error("Password update error", error)
    return {
      success: false,
      message: error.message || "Failed to update password. Please try again.",
    }
  }

  return {
    success: true,
    message: "Password updated. You can now log in with your new credentials.",
  }
}
