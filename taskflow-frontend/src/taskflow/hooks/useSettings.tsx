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

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const storedTheme = window.localStorage.getItem('taskflowTheme') as Theme | null;
    if (storedTheme) return storedTheme;

    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
        return 'light';
    }
};

const getInitialLanguage = (): Language => {
    if (typeof window === 'undefined') {
        return 'en';
    }

    const storedLanguage = window.localStorage.getItem('taskflowLanguage') as Language | null;
    return storedLanguage || 'en';
};

const getInitialBottomNavActions = (): ViewType[] => {
    if (typeof window === 'undefined') {
        return DEFAULT_BOTTOM_NAV;
    }

    try {
        const stored = window.localStorage.getItem('taskflowBottomNav');
        return stored ? JSON.parse(stored) : DEFAULT_BOTTOM_NAV;
    } catch {
        return DEFAULT_BOTTOM_NAV;
    }
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    const [language, setLanguage] = useState<Language>(getInitialLanguage);

    const [bottomNavActions, setBottomNavActions] = useState<ViewType[]>(getInitialBottomNavActions);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem('taskflowTheme', theme);
        const body = window.document.body;
        body.classList.remove('light', 'dark');
        body.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem('taskflowLanguage', language);
    }, [language]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem('taskflowBottomNav', JSON.stringify(bottomNavActions));
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
