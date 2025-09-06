"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectPath?: string;
}

export function RoleGuard({ allowedRoles, children, redirectPath }: RoleGuardProps) {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  const client = supabase

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await client.auth.getUser();
        
        if (error) {
          console.error('Auth check error:', error);
        }

        setUser(user || null);

        // Prefer profile.role; fallback to metadata.role
        let role: string | undefined = undefined;
        if (user) {
          const { data: profileRow } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          role = (profileRow?.role as string | undefined) || (user.user_metadata?.role as string | undefined);
        }

        const normalizedRole = role === 'job-seeker' || role === 'employee' ? 'job_seeker' : role;
        const normalizedAllowed = allowedRoles.map(r => (r === 'job-seeker' || r === 'employee' ? 'job_seeker' : r));
        setUserRole(normalizedRole || null);

        if (!normalizedRole || !normalizedAllowed.includes(normalizedRole)) {
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_OUT': {
          setAuthorized(false);
          router.push('/auth/login');
          break;
        }
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
        case 'INITIAL_SESSION': {
          checkAuth();
          break;
        }
        default: {
          // no-op
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [allowedRoles, router, client]);

  const handleRedirect = () => {
    if (redirectPath) {
      router.push(redirectPath);
    } else if (userRole === 'employer') {
      router.push('/employer/dashboard');
    } else if (userRole === 'job_seeker') {
      router.push('/job-seeker/dashboard');
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
              {userRole && (
                <span className="block mt-2 text-sm">
                  Your role: <strong>{userRole}</strong>
                  <br />
                  Required roles: <strong>{allowedRoles.join(', ')}</strong>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={handleRedirect} className="w-full">
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}