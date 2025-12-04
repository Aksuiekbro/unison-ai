import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import type { Database } from './types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get user ID from middleware headers - FAST (no DB call)
 * Returns null if not authenticated or headers not available
 */
export const getUserIdFromMiddleware = cache(async () => {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const userRole = headersList.get('x-user-role')
    return { userId, userRole }
  } catch {
    return { userId: null, userRole: null }
  }
})

/**
 * Request-memoized user getter. 
 * Call this from multiple server components in the same request - 
 * only ONE database round-trip will be made.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
})

/**
 * Request-memoized user data getter (role, assessment status, etc.)
 * Combines auth + user table data in a single cached call.
 */
export const getUserWithProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { user: null, profile: null, error: authError }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, full_name, email, personality_assessment_completed, productivity_assessment_completed')
    .eq('id', user.id)
    .single()

  return { user, profile, error: profileError }
})