// server-only is a Next.js hint; safe to omit in test/runtime environments
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
  personality_assessment_completed?: boolean
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
  // Profile data is now stored in the users table (single-table architecture)
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      current_job_title,
      resume_url,
      linkedin_url,
      github_url,
      portfolio_url,
      company_culture,
      hiring_preferences,
      personality_assessment_completed,
      created_at,
      updated_at
    `)
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  
  // Map to ProfileRow structure for backwards compatibility
  if (!data) return null;
  return {
    id: data.id,
    user_id: data.id,
    current_job_title: data.current_job_title,
    resume_url: data.resume_url,
    linkedin_url: data.linkedin_url,
    github_url: data.github_url,
    portfolio_url: data.portfolio_url,
    company_culture: data.company_culture,
    hiring_preferences: data.hiring_preferences,
    personality_test_completed: data.personality_assessment_completed,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as ProfileRow;
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
