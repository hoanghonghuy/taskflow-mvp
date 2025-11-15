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
    const [theme, setTheme] = useState<Theme>('light');
    const [language, setLanguage] = useState<Language>('en');
    const [bottomNavActions, setBottomNavActions] = useState<ViewType[]>(DEFAULT_BOTTOM_NAV);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const storedTheme = window.localStorage.getItem('taskflowTheme') as Theme | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

        const storedLanguage = window.localStorage.getItem('taskflowLanguage') as Language | null;
        setLanguage(storedLanguage || 'en');

        try {
            const storedNav = window.localStorage.getItem('taskflowBottomNav');
            setBottomNavActions(storedNav ? JSON.parse(storedNav) : DEFAULT_BOTTOM_NAV);
        } catch {
            setBottomNavActions(DEFAULT_BOTTOM_NAV);
        }

        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated || typeof document === 'undefined' || typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem('taskflowTheme', theme);
        const body = document.body;
        body.classList.remove('light', 'dark');
        body.classList.add(theme);
    }, [theme, isHydrated]);

    useEffect(() => {
        if (!isHydrated || typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem('taskflowLanguage', language);
    }, [language, isHydrated]);

    useEffect(() => {
        if (!isHydrated || typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem('taskflowBottomNav', JSON.stringify(bottomNavActions));
    }, [bottomNavActions, isHydrated]);


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
