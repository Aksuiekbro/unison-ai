"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Briefcase, Building2, User, Search, Settings, Heart, LogOut } from "lucide-react";

export function HeaderNavigation() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setUserRole(user?.user_metadata?.role || null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setUserRole(session?.user?.user_metadata?.role || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getNavigationItems = () => {
    if (!user || !userRole) return [];

    if (userRole === 'employer') {
      return [
        { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/employer/jobs', label: 'Manage Jobs', icon: Briefcase },
        { href: '/employer/candidates', label: 'Candidates', icon: User },
        { href: '/employer/company', label: 'Company Profile', icon: Building2 },
      ];
    } else if (userRole === 'employee' || userRole === 'job-seeker') {
      return [
        { href: '/job-seeker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/job-seeker/search', label: 'Browse Jobs', icon: Search },
        { href: '/job-seeker/saved', label: 'Saved Jobs', icon: Heart },
        { href: '/job-seeker/profile', label: 'Profile', icon: User },
        { href: '/job-seeker/settings', label: 'Settings', icon: Settings },
      ];
    }

    return [];
  };

  const navigationItems = getNavigationItems();

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b">
        <div className="container mx-auto h-16 flex items-center justify-between px-2 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/LOGO2(1).png"
                alt="UnisonAI Logo"
                width={140}
                height={40}
                className="h-8 md:h-10 w-auto"
                priority
              />
            </Link>
          </div>
          <div className="animate-pulse w-32 h-8 bg-gray-200 rounded"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b">
      <div className="container mx-auto h-16 flex items-center justify-between px-2 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/LOGO2(1).png"
              alt="UnisonAI Logo"
              width={140}
              height={40}
              className="h-8 md:h-10 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Hamburger Icon */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10"
          aria-label="Open navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`block h-0.5 w-6 bg-black transition-all duration-200 ${open ? "rotate-45 translate-y-1.5" : ""}`}></span>
          <span className={`block h-0.5 w-6 bg-black my-1 transition-all duration-200 ${open ? "opacity-0" : ""}`}></span>
          <span className={`block h-0.5 w-6 bg-black transition-all duration-200 ${open ? "-rotate-45 -translate-y-1.5" : ""}`}></span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-base font-medium">
          {user ? (
            <>
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 text-gray-700 hover:text-black"
                  >
                    <IconComponent className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              <Link href="/" className="text-gray-700 hover:text-black">Product</Link>
              <a href="#features" className="text-gray-700 hover:text-black">Functions</a>
              <Link href="#uni-modules" className="text-gray-700 hover:text-black">Programs</Link>
              <Link href="#tools" className="text-gray-700 hover:text-black">Tools</Link>
              <Link href="#pricing" className="text-gray-700 hover:text-black">Pricing</Link>
              <a href="#footer" className="text-gray-700 hover:text-black">Contacts</a>
            </>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.email} ({userRole})
              </span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-base font-medium text-gray-700 hover:text-black px-2 py-1">
                Login
              </Link>
              <Link href="/auth/signup" className="rounded-md bg-black px-4 py-2 text-base font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div className="md:hidden w-full bg-white border-t border-gray-200">
          <nav className="flex flex-col items-center gap-2 py-2 text-base font-medium">
            {user ? (
              <>
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 text-gray-700 hover:text-black w-full text-center px-4 py-2"
                      onClick={() => setOpen(false)}
                    >
                      <IconComponent className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="flex flex-col items-center gap-2 mt-2 pt-2 border-t">
                  <span className="text-sm text-gray-600">
                    {user.email} ({userRole})
                  </span>
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setOpen(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/" className="text-gray-700 hover:text-black w-full text-center" onClick={() => setOpen(false)}>Product</Link>
                <a href="#features" className="text-gray-700 hover:text-black w-full text-center" onClick={() => setOpen(false)}>Functions</a>
                <Link href="#uni-modules" className="text-gray-700 hover:text-black w-full text-center" onClick={() => setOpen(false)}>Programs</Link>
                <Link href="#tools" className="text-gray-700 hover:text-black w-full text-center" onClick={() => setOpen(false)}>Tools</Link>
                <Link href="#pricing" className="text-gray-700 hover:text-black w-full text-center" onClick={() => setOpen(false)}>Pricing</Link>
                <a href="#footer" className="text-gray-700 hover:text-black w-full text-center" onClick={() => setOpen(false)}>Contacts</a>
                <div className="flex flex-col items-center gap-2 mt-2">
                  <Link href="/auth/login" className="text-base font-medium text-gray-700 hover:text-black px-2 py-1" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                  <Link href="/auth/signup" className="rounded-md bg-black px-4 py-2 text-base font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black" onClick={() => setOpen(false)}>
                    Sign up
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}