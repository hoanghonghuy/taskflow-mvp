export type TranslationKey = string;
export interface TranslationNamespace {
    [key: string]: string | TranslationNamespace;
}
export interface I18nConfig {
    defaultLanguage: string;
    supportedLanguages: string[];
    fallbackLanguage: string;
}
export interface I18nService {
    t: (key: TranslationKey, params?: Record<string, any>) => string;
    setLanguage: (language: string) => void;
    getLanguage: () => string;
    formatDate: (date: Date | string, format?: string) => string;
    formatRelativeTime: (date: Date | string) => string;
    pluralize: (key: TranslationKey, count: number, params?: Record<string, any>) => string;
}
