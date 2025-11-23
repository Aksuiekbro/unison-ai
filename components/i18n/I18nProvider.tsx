"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultLocale, fallbackLocale, localeCookieName, Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { TranslationDictionary } from "@/lib/i18n/types";
import { isLocale, translateFromDictionaries } from "@/lib/i18n/utils";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const persistLocale = (locale: Locale) => {
  const cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.cookie = cookie;
  try {
    localStorage.setItem(localeCookieName, locale);
  } catch {
    // ignore
  }
  document.documentElement.lang = locale;
};

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const hydratedLocale = useMemo<Locale>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(localeCookieName) : null;
    if (isLocale(stored)) return stored;
    if (isLocale(initialLocale)) return initialLocale;
    return defaultLocale;
  }, [initialLocale]);

  const [locale, setLocaleState] = useState<Locale>(hydratedLocale);
  const [dictionary, setDictionary] = useState<TranslationDictionary>(() => getDictionary(hydratedLocale));
  const fallbackDictionary = useMemo<TranslationDictionary>(() => getDictionary(fallbackLocale), []);

  useEffect(() => {
    const nextDictionary = getDictionary(locale);
    setDictionary(nextDictionary);
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return;
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) =>
      translateFromDictionaries(dictionary, fallbackDictionary, key, values),
    [dictionary, fallbackDictionary]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
};
