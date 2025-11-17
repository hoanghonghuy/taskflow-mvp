"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluralize = exports.formatRelativeTime = exports.formatDate = exports.getLanguage = exports.setLanguage = exports.t = exports.i18n = exports.TaskFlowI18n = void 0;
const en_json_1 = __importDefault(require("./translations/en.json"));
const vi_json_1 = __importDefault(require("./translations/vi.json"));
class TaskFlowI18n {
    constructor(config = {}) {
        this.config = {
            defaultLanguage: 'en',
            supportedLanguages: ['en', 'vi'],
            fallbackLanguage: 'en',
            ...config
        };
        this.currentLanguage = this.config.defaultLanguage;
        this.translations = {
            en: en_json_1.default,
            vi: vi_json_1.default
        };
    }
    t(key, params = {}) {
        const translation = this.getTranslation(key, this.currentLanguage);
        return this.interpolate(translation, params);
    }
    setLanguage(language) {
        if (this.config.supportedLanguages.includes(language)) {
            this.currentLanguage = language;
        }
        else {
            console.warn(`Language "${language}" is not supported. Falling back to "${this.config.fallbackLanguage}"`);
            this.currentLanguage = this.config.fallbackLanguage;
        }
    }
    getLanguage() {
        return this.currentLanguage;
    }
    formatDate(date, format = 'medium') {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }
        const formatOptions = {
            short: { month: 'short', day: 'numeric' },
            medium: { month: 'short', day: 'numeric', year: 'numeric' },
            long: { month: 'long', day: 'numeric', year: 'numeric' },
            full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
        };
        return dateObj.toLocaleDateString(this.currentLanguage, formatOptions[format] || formatOptions.medium);
    }
    formatRelativeTime(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffMs = dateObj.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
            return this.t('common.today');
        }
        else if (diffDays === 1) {
            return this.t('common.tomorrow');
        }
        else if (diffDays === -1) {
            return this.t('common.yesterday');
        }
        else if (diffDays > 0 && diffDays <= 7) {
            return this.t('common.daysAway', { days: diffDays });
        }
        else if (diffDays < 0 && diffDays >= -7) {
            return this.t('common.daysAgo', { days: Math.abs(diffDays) });
        }
        else {
            return this.formatDate(dateObj);
        }
    }
    pluralize(key, count, params = {}) {
        const pluralKey = `${key}.${count === 1 ? 'one' : 'other'}`;
        const translation = this.getTranslation(pluralKey, this.currentLanguage);
        return this.interpolate(translation, { ...params, count });
    }
    getTranslation(key, language) {
        const keys = key.split('.');
        let translation = this.translations[language];
        for (const k of keys) {
            if (translation && typeof translation === 'object' && k in translation) {
                translation = translation[k];
            }
            else {
                // Fallback to fallback language
                let fallbackTranslation = this.translations[this.config.fallbackLanguage];
                for (const fallbackKey of keys) {
                    if (fallbackTranslation && typeof fallbackTranslation === 'object' && fallbackKey in fallbackTranslation) {
                        fallbackTranslation = fallbackTranslation[fallbackKey];
                    }
                    else {
                        return key; // Return key if translation not found
                    }
                }
                return typeof fallbackTranslation === 'string' ? fallbackTranslation : key;
            }
        }
        return typeof translation === 'string' ? translation : key;
    }
    interpolate(template, params) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? String(params[key]) : match;
        });
    }
}
exports.TaskFlowI18n = TaskFlowI18n;
// Default instance
exports.i18n = new TaskFlowI18n();
// Convenience functions
const t = (key, params) => exports.i18n.t(key, params);
exports.t = t;
const setLanguage = (language) => exports.i18n.setLanguage(language);
exports.setLanguage = setLanguage;
const getLanguage = () => exports.i18n.getLanguage();
exports.getLanguage = getLanguage;
const formatDate = (date, format) => exports.i18n.formatDate(date, format);
exports.formatDate = formatDate;
const formatRelativeTime = (date) => exports.i18n.formatRelativeTime(date);
exports.formatRelativeTime = formatRelativeTime;
const pluralize = (key, count, params) => exports.i18n.pluralize(key, count, params);
exports.pluralize = pluralize;
