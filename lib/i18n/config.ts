export const supportedLocales = ['ru', 'kk', 'en'] as const
export type Locale = typeof supportedLocales[number]

export const defaultLocale: Locale = 'ru'
export const fallbackLocale: Locale = defaultLocale
export const localeCookieName = 'ui-locale'

export const localeLabels: Record<Locale, string> = {
  ru: 'Русский',
  kk: 'Қазақша',
  en: 'English',
}
