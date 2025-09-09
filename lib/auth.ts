import { supabase } from './supabase-client';
import { supabaseAdmin } from './supabase-admin';
import { User } from '@supabase/supabase-js';

export type UserRole = 'employer' | 'job_seeker';

export type AuthUser = User & {
  user_metadata?: {
    role?: UserRole;
    full_name?: string;
    company_name?: string;
  }
}

export interface UserRow {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string | null
  phone?: string | null
  location?: string | null
  bio?: string | null
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: AuthUser | null;
  profile: ProfileRow | null;
  userData: UserRow | null;
  isLoading: boolean;
}

export interface ProfileRow {
  id: string
  user_id: string
  experience_years?: number | null
  current_job_title?: string | null
  desired_salary_min?: number | null
  desired_salary_max?: number | null
  preferred_location?: string | null
  remote_preference?: boolean | null
  resume_url?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  company_culture?: string | null
  hiring_preferences?: string | null
  personality_test_completed?: boolean
  resume_parsed?: boolean
  ai_analysis_completed?: boolean
  created_at: string
  updated_at: string
}

// Client-side auth functions
export async function signUp(
  email: string, 
  password: string, 
  metadata: {
    role: UserRole;
    full_name: string;
    company_name?: string;
  }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    }
  });

  if (error) throw error;

  // Create user record in the database
  if (data.user) {
    // Use service role to bypass RLS during initial user creation
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: data.user.id,
        email: email,
        full_name: metadata.full_name,
        role: metadata.role,
      });

    if (userError) throw userError;

    // Single-table approach - no separate profiles table needed
    // All profile data is stored directly in the users table
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user as AuthUser | null;
}

export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUserProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getUserData(userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Utility functions
export function hasRole(user: AuthUser | null, userData: UserRow | null, role: UserRole): boolean {
  return userData?.role === role || user?.user_metadata?.role === role;
}

export function getUserRole(user: AuthUser | null, userData: UserRow | null): UserRole | null {
  return userData?.role || user?.user_metadata?.role || null;
}