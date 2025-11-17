import { I18nService, I18nConfig } from './types';
export declare class TaskFlowI18n implements I18nService {
    private currentLanguage;
    private config;
    private translations;
    constructor(config?: Partial<I18nConfig>);
    t(key: string, params?: Record<string, any>): string;
    setLanguage(language: string): void;
    getLanguage(): string;
    formatDate(date: Date | string, format?: string): string;
    formatRelativeTime(date: Date | string): string;
    pluralize(key: string, count: number, params?: Record<string, any>): string;
    private getTranslation;
    private interpolate;
}
export declare const i18n: TaskFlowI18n;
export declare const t: (key: string, params?: Record<string, any>) => string;
export declare const setLanguage: (language: string) => void;
export declare const getLanguage: () => string;
export declare const formatDate: (date: Date | string, format?: string) => string;
export declare const formatRelativeTime: (date: Date | string) => string;
export declare const pluralize: (key: string, count: number, params?: Record<string, any>) => string;
