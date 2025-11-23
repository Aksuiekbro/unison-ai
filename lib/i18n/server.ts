import { cookies, headers } from 'next/headers'
import { defaultLocale, localeCookieName, Locale, supportedLocales } from './config'
import { getDictionary } from './dictionaries'
import { TranslationDictionary } from './types'
import { isLocale } from './utils'

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

export const detectLocale = (): Locale => {
  const cookieLocale = cookies().get(localeCookieName)?.value
  if (isLocale(cookieLocale)) return cookieLocale

  const headerLocale = parseAcceptLanguage(headers().get('accept-language'))
  if (headerLocale && (supportedLocales as readonly string[]).includes(headerLocale)) {
    return headerLocale
  }

  return defaultLocale
}

export const getServerDictionary = (locale?: Locale): TranslationDictionary => {
  const normalized = locale && (supportedLocales as readonly string[]).includes(locale) ? locale : defaultLocale
  return getDictionary(normalized as Locale)
}
