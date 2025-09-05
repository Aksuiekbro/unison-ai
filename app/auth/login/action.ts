"use server"

import { z } from "zod"
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

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
    const cookieStore = await cookies()
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore })
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (authError || !authData.user) {
      return {
        success: false,
        message: "Invalid email or password.",
      }
    }

    // Resolve role from profiles or user metadata (cookie-bound client → RLS works)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    const role = (profile?.role || (authData.user.user_metadata as any)?.role) as any

    return {
      success: true,
      message: "Login successful!",
      role,
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred. Please try again.",
    }
  }
}