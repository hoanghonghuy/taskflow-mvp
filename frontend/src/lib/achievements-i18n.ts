import type { TranslationKey } from '@/lib/i18n/types'

/** Maps achievement id (e.g. first-task) to i18n key segment (e.g. firstTask). */
export function achievementItemKey(id: string): string {
  return id.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

export function achievementTitleKey(id: string): TranslationKey {
  return `achievements.items.${achievementItemKey(id)}.title` as TranslationKey
}

export function achievementDescriptionKey(id: string): TranslationKey {
  return `achievements.items.${achievementItemKey(id)}.description` as TranslationKey
}
