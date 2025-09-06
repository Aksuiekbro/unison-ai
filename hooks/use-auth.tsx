'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Database } from '@/lib/types/database';
import type { AuthUser, ProfileRow as UserProfile, AuthState } from '@/lib/auth-shared';

const AuthContext = createContext<AuthState & {
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Use shared singleton client to avoid multiple GoTrue instances
  const client = supabase

  const refreshAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user: currentUser } } = await client.auth.getUser();
      setUser(currentUser as AuthUser | null);

      if (currentUser) {
        const { data: userProfile } = await client
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();
        setProfile((userProfile as UserProfile) || null);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const handleSignOut = useCallback(async () => {
    try {
      await client.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [client]);

  useEffect(() => {
    // Initial auth state
    refreshAuth();

    // Listen for auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user as AuthUser);
            const { data: userProfile } = await client
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            setProfile((userProfile as UserProfile) || null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client]);

  const contextValue = useMemo(() => ({
    user,
    profile,
    isLoading,
    signOut: handleSignOut,
    refreshAuth,
  }), [user, profile, isLoading, handleSignOut, refreshAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}