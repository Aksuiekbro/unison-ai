import { cookies, headers } from 'next/headers'
import { defaultLocale, fallbackLocale, localeCookieName, Locale, supportedLocales } from './config'
import { getDictionary } from './dictionaries'
import { TranslationDictionary } from './types'
import { isLocale, translateFromDictionaries } from './utils'

const parseAcceptLanguage = (headerValue: string | null): Locale | null => {
  if (!headerValue) return null
  const locales = headerValue.split(',').map((part) => part.trim().split(';')[0])
  for (const locale of locales) {
    const base = locale.split('-')[0]
    if (isLocale(locale)) return locale
    if (isLocale(base)) return base
  }
  return null
}

export const detectLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(localeCookieName)?.value
  if (isLocale(cookieLocale)) return cookieLocale

  const headerStore = await headers()
  const headerLocale = parseAcceptLanguage(headerStore.get('accept-language'))
  if (headerLocale && (supportedLocales as readonly string[]).includes(headerLocale)) {
    return headerLocale
  }

  return defaultLocale
}

export const getServerDictionary = (locale?: Locale): TranslationDictionary => {
  const normalized = locale && (supportedLocales as readonly string[]).includes(locale) ? locale : defaultLocale
  return getDictionary(normalized as Locale)
}

type Translator = (key: string, values?: Record<string, string | number>) => string

export const createServerTranslator = async (
  preferredLocale?: Locale
): Promise<{ t: Translator; locale: Locale }> => {
  const locale = preferredLocale && isLocale(preferredLocale) ? preferredLocale : await detectLocale()
  const primaryDictionary = getDictionary(locale)
  const fallbackDictionary =
    locale === fallbackLocale ? primaryDictionary : getDictionary(fallbackLocale)

  const t: Translator = (key, values) => translateFromDictionaries(primaryDictionary, fallbackDictionary, key, values)

  return { t, locale }
}
