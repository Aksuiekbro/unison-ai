"use client";

import clsx from "clsx";
import { localeLabels, Locale, supportedLocales } from "@/lib/i18n/config";
import { useI18n } from "./I18nProvider";

type LanguageSwitcherProps = {
  className?: string;
  size?: "sm" | "md";
};

export function LanguageSwitcher({ className, size = "md" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  const sizeClasses =
    size === "sm"
      ? "h-9 text-sm px-2"
      : "h-10 text-sm px-3";

  return (
    <label className={clsx("inline-flex items-center gap-2", className)}>
      <span className="text-sm text-gray-600 hidden lg:inline">{t("common.locale")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={clsx(
          "rounded-md border border-gray-200 bg-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
          "text-gray-800",
          sizeClasses
        )}
        aria-label={t("common.locale")}
      >
        {supportedLocales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
