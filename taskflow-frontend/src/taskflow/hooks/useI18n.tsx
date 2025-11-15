'use client'

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSettings } from './useSettings';
import en from '../locales/en.json';
import vi from '../locales/vi.json';

interface Translations {
    [key: string]: string;
}

interface AllTranslations {
    en: Translations;
    vi: Translations;
}

interface I18nContextType {
    t: (key: string, options?: { [key: string]: string | number }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { language } = useSettings();
    const translations = useMemo<AllTranslations>(() => ({ en, vi }), []);

    const t = (key: string, options?: { [key: string]: string | number }): string => {
        const langDict = translations[language] || translations.en;
        let translation = langDict[key] || key;
        
        if (options) {
            Object.keys(options).forEach(optKey => {
                const regex = new RegExp(`\\{\\{${optKey}\\}\\}`, 'g');
                translation = translation.replace(regex, String(options[optKey]));
            });
        }
        
        return translation;
    };
    
    return (
        <I18nContext.Provider value={{ t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = (): I18nContextType => {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
};
