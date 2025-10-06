export type UserRole = 'employer' | 'job_seeker'

export interface ProfileRow {
  id: string
  role: UserRole
  email: string
  first_name?: string | null
  last_name?: string | null
}

export interface AuthState {
  user: AuthUser | null
  profile: ProfileRow | null
  isLoading: boolean
}

export type AuthUser = (import('@supabase/supabase-js').User) & {
  user_metadata?: {
    role?: UserRole
    full_name?: string
    company_name?: string
    avatar_url?: string
  }
}

export function hasRole(user: AuthUser | null, profile: ProfileRow | null, role: UserRole): boolean {
  return (profile?.role ?? user?.user_metadata?.role ?? null) === role
}

export function getUserRole(user: AuthUser | null, profile: ProfileRow | null): UserRole | null {
  return (profile?.role ?? user?.user_metadata?.role ?? null) as UserRole | null
}
