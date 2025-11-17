import { I18nService, I18nConfig, TranslationNamespace } from './types';
import enTranslations from './translations/en.json';
import viTranslations from './translations/vi.json';

export class TaskFlowI18n implements I18nService {
  private currentLanguage: string;
  private config: I18nConfig;
  private translations: Record<string, TranslationNamespace>;

  constructor(config: Partial<I18nConfig> = {}) {
    this.config = {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'vi'],
      fallbackLanguage: 'en',
      ...config
    };
    
    this.currentLanguage = this.config.defaultLanguage;
    this.translations = {
      en: enTranslations,
      vi: viTranslations
    };
  }

  t(key: string, params: Record<string, any> = {}): string {
    const translation = this.getTranslation(key, this.currentLanguage);
    return this.interpolate(translation, params);
  }

  setLanguage(language: string): void {
    if (this.config.supportedLanguages.includes(language)) {
      this.currentLanguage = language;
    } else {
      console.warn(`Language "${language}" is not supported. Falling back to "${this.config.fallbackLanguage}"`);
      this.currentLanguage = this.config.fallbackLanguage;
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  formatDate(date: Date | string, format: string = 'medium'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: { month: 'short', day: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric' },
      full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    };

    return dateObj.toLocaleDateString(this.currentLanguage, formatOptions[format] || formatOptions.medium);
  }

  formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return this.t('common.today');
    } else if (diffDays === 1) {
      return this.t('common.tomorrow');
    } else if (diffDays === -1) {
      return this.t('common.yesterday');
    } else if (diffDays > 0 && diffDays <= 7) {
      return this.t('common.daysAway', { days: diffDays });
    } else if (diffDays < 0 && diffDays >= -7) {
      return this.t('common.daysAgo', { days: Math.abs(diffDays) });
    } else {
      return this.formatDate(dateObj);
    }
  }

  pluralize(key: string, count: number, params: Record<string, any> = {}): string {
    const pluralKey = `${key}.${count === 1 ? 'one' : 'other'}`;
    const translation = this.getTranslation(pluralKey, this.currentLanguage);
    return this.interpolate(translation, { ...params, count });
  }

  private getTranslation(key: string, language: string): string {
    const keys = key.split('.');
    let translation: any = this.translations[language];

    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Fallback to fallback language
        let fallbackTranslation: any = this.translations[this.config.fallbackLanguage];
        for (const fallbackKey of keys) {
          if (fallbackTranslation && typeof fallbackTranslation === 'object' && fallbackKey in fallbackTranslation) {
            fallbackTranslation = fallbackTranslation[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        return typeof fallbackTranslation === 'string' ? fallbackTranslation : key;
      }
    }

    return typeof translation === 'string' ? translation : key;
  }

  private interpolate(template: string, params: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }
}

// Default instance
export const i18n = new TaskFlowI18n();

// Convenience functions
export const t = (key: string, params?: Record<string, any>) => i18n.t(key, params);
export const setLanguage = (language: string) => i18n.setLanguage(language);
export const getLanguage = () => i18n.getLanguage();
export const formatDate = (date: Date | string, format?: string) => i18n.formatDate(date, format);
export const formatRelativeTime = (date: Date | string) => i18n.formatRelativeTime(date);
export const pluralize = (key: string, count: number, params?: Record<string, any>) => i18n.pluralize(key, count, params);
