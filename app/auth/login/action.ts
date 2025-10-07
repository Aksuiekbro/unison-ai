"use server"

import { z } from "zod"
import type { Database } from '@/lib/database.types'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

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
    const supabase = await createClient()
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

    // Resolve role from users table or user metadata (cookie-bound client → RLS works)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    const role = (userData?.role || (authData.user.user_metadata as any)?.role) as any
    const normalizedRole = role === 'job-seeker' || role === 'employee' ? 'job_seeker' : role

    // In test env, return data instead of redirecting for easier assertions
    if (process.env.NODE_ENV === 'test') {
      return {
        success: true,
        role,
      }
    }

    // Handle optional redirect target from the login page
    const redirectTo = (data as any).redirectTo as string | undefined
    if (redirectTo && redirectTo.startsWith('/')) redirect(redirectTo)

    if (normalizedRole === 'employer') redirect('/employer/dashboard')
    if (normalizedRole === 'job_seeker') redirect('/job-seeker/dashboard')

    // Fallback if role unknown
    redirect('/')
  } catch (error: any) {
    // Allow Next.js redirect() to bubble so navigation happens client-side
    if (error?.digest === 'NEXT_REDIRECT') throw error
    console.error('Login error:', error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred. Please try again.",
    }
  }
}