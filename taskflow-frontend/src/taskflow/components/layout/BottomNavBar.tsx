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
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSelect = (view: ViewType) => {
        dispatch({ type: 'SET_VIEW', payload: view });
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="w-full rounded-xl border border-border bg-popover/95 p-2 text-left shadow-xl backdrop-blur"
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
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary"
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
    
    const NavButton: React.FC<{
        feature: typeof ALL_FEATURES[0];
        isActive: boolean;
    }> = ({ feature, isActive }) => {
        const Icon = feature.icon;
        return (
            <button
                type="button"
                onClick={() => dispatch({ type: 'SET_VIEW', payload: feature.view })}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 transition-all ${
                    isActive ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
            >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium">{t(feature.label)}</span>
            </button>
        );
    };

    return (
        <nav className="md:hidden fixed inset-x-0 bottom-3 z-30 flex justify-center px-3" aria-label="TaskFlow mobile navigation">
            <div className="pointer-events-auto flex w-full max-w-xl items-stretch gap-1 rounded-2xl border border-border/70 bg-background/90 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/75 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
                {visibleFeatures.map(feature => (
                    <NavButton key={feature.view} feature={feature} isActive={state.view === feature.view} />
                ))}
                {hiddenFeatures.length > 0 && (
                    <div className="relative flex-1">
                        <button
                            type="button"
                            onClick={() => setIsMoreMenuOpen(p => !p)}
                            className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                                isMoreMenuOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            }`}
                            aria-expanded={isMoreMenuOpen}
                            aria-haspopup="menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                            <span className="text-[10px] font-medium">{t('feature.more')}</span>
                        </button>
                        {isMoreMenuOpen && (
                            <div className="absolute bottom-[calc(100%+0.5rem)] right-0 w-44">
                                <MoreMenu hiddenViews={hiddenFeatures} onClose={() => setIsMoreMenuOpen(false)} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default BottomNavBar;
