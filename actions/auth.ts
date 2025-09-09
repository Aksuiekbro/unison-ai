"use server"

import { z } from "zod"
import { supabase } from "@/lib/supabase-client"
import { supabaseAdmin } from "@/lib/supabase-admin"

// Types
interface UserRow {
  id: string
  role: "employer" | "job_seeker"
  email: string
  full_name?: string
  company_name?: string
  created_at?: string
  updated_at?: string
}

// Schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

const signupSchema = z.object({
  role: z.enum(["employer", "employee", "job-seeker", "job_seeker"]),
  companyName: z.string().optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Auth functions
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

    // Get user profile data (from users table)
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profileData) {
      return {
        success: false,
        message: "Failed to retrieve user profile.",
      }
    }

    return {
      success: true,
      message: "Login successful!",
      role: profileData.role,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function signupAction(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData)
  const parsed = signupSchema.safeParse(data)

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data. Please check your entries.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  // Normalize role to db enum
  const normalizedRole = ((): "employer" | "job_seeker" => {
    if (parsed.data.role === 'employee') return 'job_seeker'
    if (parsed.data.role === 'job-seeker') return 'job_seeker'
    return parsed.data.role as "employer" | "job_seeker"
  })()

  try {
    // Create auth user with email confirmed (server-side path)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { role: normalizedRole, full_name: parsed.data.fullName, company_name: parsed.data.companyName },
    })

    if (authError || !authData.user) {
      return {
        success: false,
        message: "Failed to create account. Email may already be in use.",
      }
    }

    // Create user profile in users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: parsed.data.email,
        role: normalizedRole,
        full_name: parsed.data.fullName,
      })

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        message: "Failed to create user profile. Please try again.",
      }
    }

    return {
      success: true,
      message: "Account created successfully!",
      role: normalizedRole,
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to create account. Please try again.",
    }
  }
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return data as unknown as UserRow
  } catch {
    return null
  }
}

export async function getUserById(id: string): Promise<UserRow | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as unknown as UserRow
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<UserRow | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return await getUserById(user.id)
  } catch {
    return null
  }
}