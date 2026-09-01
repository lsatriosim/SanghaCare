import idDict from '@/dictionaries/id.json'
import enDict from '@/dictionaries/en.json'
import thDict from '@/dictionaries/th.json'

// Gabungkan dalam objek kamus terpusat
const dictionaries = {
  id: idDict,
  en: enDict,
  th: thDict,
}

export type Locale = 'id' | 'en' | 'th'

export const getDictionary = (locale: Locale) => {
  return dictionaries[locale] || dictionaries.id
}

export const getClientLocale = (): Locale => {
  if (typeof document === 'undefined') return 'id'
  const match = document.cookie.match(/(^|;\s*)NEXT_LOCALE=([^;]*)/)
  const locale = match ? match[2] : 'id'
  return ['id', 'en', 'th'].includes(locale) ? (locale as Locale) : 'id'
}