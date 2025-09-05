import { supabase, Database } from './supabase';
import { User } from '@supabase/supabase-js';

export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = 'employer' | 'job_seeker';

export interface AuthUser extends User {
  user_metadata?: {
    role?: UserRole;
    full_name?: string;
    company_name?: string;
  };
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
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
      data: metadata
    }
  });

  if (error) throw error;

  // Create user profile in the database
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        role: metadata.role,
        email: email,
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

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Utility functions
export function hasRole(user: AuthUser | null, profile: UserProfile | null, role: UserRole): boolean {
  return profile?.role === role || user?.user_metadata?.role === role;
}

export function getUserRole(user: AuthUser | null, profile: UserProfile | null): UserRole | null {
  return profile?.role || user?.user_metadata?.role || null;
}