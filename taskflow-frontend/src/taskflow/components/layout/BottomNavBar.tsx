'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useSettings } from '../../hooks/useSettings';
import { useTranslation } from '../../hooks/useI18n';
import { ViewType } from '../../types';
import { StopwatchIcon, ListBulletIcon, CalendarDaysIcon, GridIcon, RepeatIcon, HourglassIcon, HomeIcon, ViewColumnsIcon } from '../../constants';

const ALL_FEATURES: { view: ViewType, icon: React.FC<{className?: string}>, label: string }[] = [
    { view: 'dashboard', icon: HomeIcon, label: 'feature.dashboard' },
    { view: 'list', icon: ListBulletIcon, label: 'feature.listView' },
    { view: 'board', icon: ViewColumnsIcon, label: 'feature.boardView' },
    { view: 'calendar', icon: CalendarDaysIcon, label: 'feature.calendarView' },
    { view: 'matrix', icon: GridIcon, label: 'feature.matrixView' },
    { view: 'habit', icon: RepeatIcon, label: 'feature.habitTracker' },
    { view: 'pomodoro', icon: StopwatchIcon, label: 'feature.pomodoro' },
    { view: 'countdown', icon: HourglassIcon, label: 'feature.countdown' },
];

const MoreMenu: React.FC<{ hiddenViews: ViewType[], onClose: () => void }> = ({ hiddenViews, onClose }) => {
    const { dispatch } = useTaskManager();
    const { t } = useTranslation();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleSelect = (view: ViewType) => {
        dispatch({ type: 'SET_VIEW', payload: view });
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="absolute bottom-full right-2 mb-3 w-52 bg-popover rounded-xl shadow-2xl border border-border/80 animate-fade-in p-2"
            role="menu"
            aria-label={t('feature.more')}
        >
            <div className="space-y-1">
                {hiddenViews.map(view => {
                    const feature = ALL_FEATURES.find(f => f.view === view);
                    if (!feature) return null;
                    const Icon = feature.icon;
                    return (
                        <button
                            key={view}
                            type="button"
                            onClick={() => handleSelect(view)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                            role="menuitem"
                        >
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <span>{t(feature.label)}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const BottomNavBar: React.FC = () => {
    const { state, dispatch } = useTaskManager();
    const { bottomNavActions } = useSettings();
    const { t } = useTranslation();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const visibleFeatures = ALL_FEATURES.filter(f => bottomNavActions.includes(f.view));
    const hiddenFeatures = ALL_FEATURES.filter(f => !bottomNavActions.includes(f.view)).map(f => f.view);

    useEffect(() => {
        setIsMoreMenuOpen(false);
    }, [state.view]);

    const NavButton: React.FC<{
        feature: typeof ALL_FEATURES[0];
        isActive: boolean;
    }> = ({ feature, isActive }) => {
        const Icon = feature.icon;
        return (
            <button
                type="button"
                onClick={() => dispatch({ type: 'SET_VIEW', payload: feature.view })}
                className={`flex-1 rounded-2xl px-3 py-1 flex flex-col items-center justify-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={t(feature.label)}
            >
                <Icon className="h-5 w-5" />
                <span className={`text-[11px] font-medium leading-none ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                    {t(feature.label)}
                </span>
            </button>
        );
    };

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-card/90 backdrop-blur-xl supports-[backdrop-filter]:bg-card/75"
            aria-label={t('navigation.bottomNav')}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
        >
            <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-4 py-2">
                {visibleFeatures.map(feature => (
                    <NavButton key={feature.view} feature={feature} isActive={state.view === feature.view} />
                ))}
                {hiddenFeatures.length > 0 && (
                    <div className="relative flex-1">
                        <button
                            type="button"
                            onClick={() => setIsMoreMenuOpen(p => !p)}
                            className={`w-full rounded-2xl px-3 py-1 flex flex-col items-center justify-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                                isMoreMenuOpen ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                            aria-expanded={isMoreMenuOpen}
                            aria-haspopup="menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                            <span className="text-[11px] font-medium leading-none">{t('feature.more')}</span>
                        </button>
                        {isMoreMenuOpen && <MoreMenu hiddenViews={hiddenFeatures} onClose={() => setIsMoreMenuOpen(false)} />}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default BottomNavBar;
