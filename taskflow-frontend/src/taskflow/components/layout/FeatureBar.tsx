'use client'

import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, StopwatchIcon, ListBulletIcon, CalendarDaysIcon, GridIcon, RepeatIcon, HourglassIcon, HomeIcon, ViewColumnsIcon, UserCircleIcon, SettingsIcon, TrophyIcon } from '../../constants';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useUser } from '../../hooks/useUser';
import Avatar from '../ui/Avatar';
import ProfileDropdown from '../auth/ProfileDropdown';
import { useTranslation } from '../../hooks/useI18n';

interface FeatureBarProps {
    onSidebarToggle: () => void;
}

const FeatureBar: React.FC<FeatureBarProps> = ({ onSidebarToggle }) => {
    const { state, dispatch } = useTaskManager();
    const { user } = useUser();
    const { t } = useTranslation();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const NavButton: React.FC<{
        label: string;
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
        className?: string;
    }> = ({ label, onClick, isActive, children, className }) => (
        <button
            onClick={onClick}
            title={label}
            aria-label={label}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            } ${className}`}
        >
            {children}
        </button>
    );

    return (
        <nav className="hidden md:flex flex-col flex-shrink-0 w-16 h-full border-r border-border items-center py-4 justify-between">
            <div className="flex flex-col items-center gap-2">
                <NavButton label={t('feature.toggleSidebar')} onClick={onSidebarToggle}>
                    <MenuIcon className="h-6 w-6" />
                </NavButton>

                <div className="border-b w-8 my-2 border-border"></div>

                <NavButton label={t('feature.dashboard')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} isActive={state.view === 'dashboard'}>
                    <HomeIcon className="h-6 w-6" />
                </NavButton>
                <NavButton label={t('feature.listView')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'list' })} isActive={state.view === 'list'}>
                    <ListBulletIcon className="h-6 w-6" />
                </NavButton>
                <NavButton label={t('feature.boardView')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'board' })} isActive={state.view === 'board'}>
                    <ViewColumnsIcon className="h-6 w-6" />
                </NavButton>
                <NavButton label={t('feature.calendarView')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'calendar' })} isActive={state.view === 'calendar'}>
                    <CalendarDaysIcon className="h-6 w-6" />
                </NavButton>
                <NavButton label={t('feature.matrixView')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'matrix' })} isActive={state.view === 'matrix'}>
                    <GridIcon className="h-6 w-6" />
                </NavButton>
                 <NavButton label={t('feature.habitTracker')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'habit' })} isActive={state.view === 'habit'}>
                    <RepeatIcon className="h-6 w-6" />
                </NavButton>
                <NavButton label={t('feature.pomodoro')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'pomodoro' })} isActive={state.view === 'pomodoro'}>
                    <StopwatchIcon className="h-6 w-6" />
                </NavButton>
                <NavButton label={t('feature.countdown')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'countdown' })} isActive={state.view === 'countdown'}>
                    <HourglassIcon className="h-6 w-6" />
                </NavButton>

            </div>
            
            <div ref={dropdownRef} className="relative flex flex-col items-center">
                <div className="border-b w-8 my-2 border-border"></div>
                 <button onClick={() => setDropdownOpen(prev => !prev)} className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                    <Avatar user={user} className="w-10 h-10" />
                 </button>
                 {isDropdownOpen && <ProfileDropdown user={user} onClose={() => setDropdownOpen(false)} />}
            </div>
        </nav>
    );
};

export default FeatureBar;
