"use server"

import { z } from "zod"
import { signIn } from "@/lib/auth"
import { redirect } from "next/navigation"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function loginAction(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData)
  const parsed = loginSchema.safeParse(data)

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const { user } = await signIn(parsed.data.email, parsed.data.password)
    
    if (!user) {
      return {
        success: false,
        message: "Invalid email or password.",
      }
    }

    // Get user role from metadata or profile
    const role = user.user_metadata?.role
    
    return {
      success: true,
      message: "Login successful!",
      role: role,
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred. Please try again.",
    }
  }
}