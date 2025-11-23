import { kk } from '@/locales/kk'
import { en } from '@/locales/en'
import { ru } from '@/locales/ru'
import { fallbackLocale, Locale } from './config'
import { TranslationDictionary } from './types'

const dictionaries: Record<Locale, TranslationDictionary> = {
  ru,
  kk,
  en,
}

export const getDictionary = (locale: Locale): TranslationDictionary => {
  return dictionaries[locale] ?? dictionaries[fallbackLocale]
}
