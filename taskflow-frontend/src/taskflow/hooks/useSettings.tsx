'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ViewType } from '../types';

type Theme = 'light' | 'dark';
type Language = 'en' | 'vi';

interface SettingsState {
    theme: Theme;
    language: Language;
    bottomNavActions: ViewType[];
    setTheme: (theme: Theme) => void;
    setLanguage: (language: Language) => void;
    setBottomNavActions: (actions: ViewType[]) => void;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

const DEFAULT_BOTTOM_NAV: ViewType[] = ['dashboard', 'list', 'calendar', 'pomodoro'];

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const storedTheme = localStorage.getItem('taskflowTheme') as Theme | null;
        if (storedTheme) return storedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const [language, setLanguage] = useState<Language>(() => {
        const storedLanguage = localStorage.getItem('taskflowLanguage') as Language | null;
        return storedLanguage || 'en';
    });

    const [bottomNavActions, setBottomNavActions] = useState<ViewType[]>(() => {
        try {
            const stored = localStorage.getItem('taskflowBottomNav');
            return stored ? JSON.parse(stored) : DEFAULT_BOTTOM_NAV;
        } catch {
            return DEFAULT_BOTTOM_NAV;
        }
    });

    useEffect(() => {
        localStorage.setItem('taskflowTheme', theme);
        const body = window.document.body;
        body.classList.remove('light', 'dark');
        body.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('taskflowLanguage', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('taskflowBottomNav', JSON.stringify(bottomNavActions));
    }, [bottomNavActions]);


    return (
        <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, bottomNavActions, setBottomNavActions }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsState => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
