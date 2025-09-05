'use client';

import { useAuth } from '@/hooks/use-auth';
import { getUserRole, UserRole } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallback?: ReactNode;
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (requiredRole) {
        const userRole = getUserRole(user, profile);
        if (userRole !== requiredRole) {
          // Redirect to appropriate dashboard based on their role
          if (userRole === 'employer') {
            router.push('/employer/dashboard');
          } else if (userRole === 'job-seeker') {
            router.push('/job-seeker/dashboard');
          } else {
            router.push('/');
          }
          return;
        }
      }
    }
  }, [user, profile, isLoading, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || null;
  }

  if (requiredRole) {
    const userRole = getUserRole(user, profile);
    if (userRole !== requiredRole) {
      return fallback || null;
    }
  }

  return <>{children}</>;
}