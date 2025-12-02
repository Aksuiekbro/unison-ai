"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { UserMenu } from "@/components/user-menu";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/i18n/I18nProvider";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" 
          : "bg-white"
      }`}
    >
      <div className="container mx-auto h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
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
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={t("header.aria.openNavigation")}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`block h-0.5 w-5 bg-gray-700 transition-all duration-200 ${open ? "rotate-45 translate-y-1.5" : ""}`}></span>
          <span className={`block h-0.5 w-5 bg-gray-700 my-1 transition-all duration-200 ${open ? "opacity-0" : ""}`}></span>
          <span className={`block h-0.5 w-5 bg-gray-700 transition-all duration-200 ${open ? "-rotate-45 -translate-y-1.5" : ""}`}></span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link 
            href="/" 
            className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {t("header.nav.product")}
          </Link>
          <a 
            href="#features" 
            className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {t("header.nav.functions")}
          </a>
          <Link 
            href="#uni-modules" 
            className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {t("header.nav.programs")}
          </Link>
          <Link 
            href="#tools" 
            className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {t("header.nav.tools")}
          </Link>
          <Link 
            href="#pricing" 
            className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {t("header.nav.pricing")}
          </Link>
          <a 
            href="#footer" 
            className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {t("header.nav.contacts")}
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher size="sm" />
          {isLoading ? null : user ? (
            <UserMenu />
          ) : (
            <>
              <Link 
                href="/auth/login" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("header.auth.login")}
              </Link>
              <Link 
                href="/auth/signup" 
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
              >
                {t("header.auth.signup")}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div className="md:hidden w-full bg-white border-t border-gray-100 shadow-lg">
          <nav className="flex flex-col py-3 px-4 text-sm font-medium">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors" 
              onClick={() => setOpen(false)}
            >
              {t("header.nav.product")}
            </Link>
            <a 
              href="#features" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors" 
              onClick={() => setOpen(false)}
            >
              {t("header.nav.functions")}
            </a>
            <Link 
              href="#uni-modules" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors" 
              onClick={() => setOpen(false)}
            >
              {t("header.nav.programs")}
            </Link>
            <Link 
              href="#tools" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors" 
              onClick={() => setOpen(false)}
            >
              {t("header.nav.tools")}
            </Link>
            <Link 
              href="#pricing" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors" 
              onClick={() => setOpen(false)}
            >
              {t("header.nav.pricing")}
            </Link>
            <a 
              href="#footer" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors" 
              onClick={() => setOpen(false)}
            >
              {t("header.nav.contacts")}
            </a>
            
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center">
              <LanguageSwitcher size="sm" />
            </div>
            
            {!isLoading && !user && (
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100">
                <Link 
                  href="/auth/login" 
                  className="text-center text-sm font-medium text-gray-600 hover:text-gray-900 py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors" 
                  onClick={() => setOpen(false)}
                >
                  {t("header.auth.login")}
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="text-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors" 
                  onClick={() => setOpen(false)}
                >
                  {t("header.auth.signup")}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
