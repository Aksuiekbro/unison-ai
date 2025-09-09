'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/database';
import { AuthUser, ProfileRow as UserProfile, UserRow, AuthState } from '@/lib/auth';

const AuthContext = createContext<AuthState & {
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}>({
  user: null,
  profile: null,
  userData: null,
  isLoading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);

  const refreshAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser as AuthUser | null);

      if (currentUser) {
        // Get user data (role, email, full_name, etc.)
        const { data: currentUserData } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();
        setUserData((currentUserData as UserRow) || null);

        // Profile data now stored in users table (single-table approach)
        setProfile(null); // No longer using separate profiles table
      } else {
        setUserData(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setUser(null);
      setUserData(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserData(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [supabase]);

  useEffect(() => {
    // Initial auth state
    refreshAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user as AuthUser);
            
            // Get user data
            const { data: currentUserData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            setUserData((currentUserData as UserRow) || null);
            
            // Profile data now in users table (single-table approach)
            setProfile(null); // No longer using separate profiles table
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserData(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const contextValue = useMemo(() => ({
    user,
    profile,
    userData,
    isLoading,
    signOut: handleSignOut,
    refreshAuth,
  }), [user, profile, userData, isLoading, handleSignOut, refreshAuth]);

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