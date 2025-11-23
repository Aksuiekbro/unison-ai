import { supportedLocales, Locale } from './config'
import { TranslationDictionary } from './types'

export const isLocale = (value: string | null | undefined): value is Locale => {
  return !!value && (supportedLocales as readonly string[]).includes(value)
}

const traverse = (dictionary: TranslationDictionary, key: string): string | TranslationDictionary | undefined => {
  return key.split('.').reduce<string | TranslationDictionary | undefined>((acc, part) => {
    if (acc && typeof acc === 'object') {
      return acc[part]
    }
    return undefined
  }, dictionary)
}

const interpolate = (template: string, values?: Record<string, string | number>): string => {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (_, token) => {
    const replacement = values[token]
    return replacement === undefined || replacement === null ? '' : String(replacement)
  })
}

export const translateFromDictionaries = (
  primary: TranslationDictionary,
  fallback: TranslationDictionary,
  key: string,
  values?: Record<string, string | number>
): string => {
  const resolved = traverse(primary, key)
  if (typeof resolved === 'string') {
    return interpolate(resolved, values)
  }
  const fallbackResolved = traverse(fallback, key)
  if (typeof fallbackResolved === 'string') {
    return interpolate(fallbackResolved, values)
  }
  return key
}

export const getIntlLocale = (locale: Locale): string => {
  switch (locale) {
    case 'kk':
      return 'kk-KZ'
    case 'en':
      return 'en-US'
    default:
      return 'ru-RU'
  }
}
