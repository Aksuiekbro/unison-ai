"use server"

import { z } from "zod"
import { signUp } from "@/lib/auth"

const signupSchema = z.object({
  role: z.enum(["employer", "job-seeker"]),
  companyName: z.string().optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function signupAction(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData)
  
  // Transform 'employee' to 'job-seeker' for consistency
  if (data.role === 'employee') {
    data.role = 'job-seeker'
  }
  
  const parsed = signupSchema.safeParse(data)

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data. Please check your entries.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    await signUp(
      parsed.data.email, 
      parsed.data.password, 
      {
        role: parsed.data.role,
        full_name: parsed.data.fullName,
        company_name: parsed.data.companyName,
      }
    )

    return {
      success: true,
      message: "Account created successfully! Please check your email to verify your account.",
      role: parsed.data.role,
    }
  } catch (error: any) {
    console.error('Signup error:', error)
    return {
      success: false,
      message: error.message || "Failed to create account. Please try again.",
    }
  }
}