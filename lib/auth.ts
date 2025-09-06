import 'server-only'
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

export interface AuthState {
  user: AuthUser | null;
  profile: ProfileRow | null;
  isLoading: boolean;
}

export interface ProfileRow {
  id: string
  role: UserRole
  email: string
  first_name?: string | null
  last_name?: string | null
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

  // Create user profile in the database
  if (data.user) {
    const [first, ...rest] = (metadata.full_name || '').trim().split(/\s+/)
    const firstName = first || email.split('@')[0]
    const lastName = rest.join(' ') || ''
    // Use service role to bypass RLS during initial profile creation
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        role: metadata.role,
        email: email,
        first_name: firstName,
        last_name: lastName,
      });

    if (profileError) throw profileError;
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
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Utility functions
export function hasRole(user: AuthUser | null, profile: ProfileRow | null, role: UserRole): boolean {
  return profile?.role === role || user?.user_metadata?.role === role;
}

export function getUserRole(user: AuthUser | null, profile: ProfileRow | null): UserRole | null {
  return profile?.role || user?.user_metadata?.role || null;
}