"use server"

import { forgotPasswordSchema, sendPasswordResetEmail, type PasswordResetResult } from "@/lib/auth/password-reset"

type ResetState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function requestPasswordResetAction(prevState: ResetState | null, formData: FormData): Promise<ResetState> {
  const email = formData.get("email")
  const parsed = forgotPasswordSchema.safeParse({ email })

  if (!parsed.success) {
    return {
      success: false,
      message: "We couldn't process your request.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const result: PasswordResetResult = await sendPasswordResetEmail(parsed.data.email)
  return result
}
