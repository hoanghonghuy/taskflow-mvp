'use client'

import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useTranslation } from '../../hooks/useI18n';
import { SunIcon, MoonIcon, StopwatchIcon, ListBulletIcon, CalendarDaysIcon, GridIcon, RepeatIcon, HourglassIcon, HomeIcon, ViewColumnsIcon, GripVerticalIcon } from '../../constants';
import { useTaskManager } from '../../hooks/useTaskManager';
import { ViewType } from '../../types';

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


const SettingsView: React.FC = () => {
    const { theme, setTheme, language, setLanguage, bottomNavActions, setBottomNavActions } = useSettings();
    const { state: taskState, dispatch: taskDispatch } = useTaskManager();
    const { t } = useTranslation();
    const [draggedItem, setDraggedItem] = useState<ViewType | null>(null);

    const { settings: pomodoroSettings } = taskState.pomodoro;

    const handlePomodoroSettingChange = (setting: string, value: string) => {
        const numberValue = parseInt(value, 10);
        if (!isNaN(numberValue) && numberValue >= 1) {
             // UI shows minutes, state stores seconds
            const valueInSeconds = setting.includes('Interval') ? numberValue : numberValue * 60;
            taskDispatch({
                type: 'UPDATE_POMODORO_SETTINGS',
                payload: { [setting]: valueInSeconds }
            });
        }
    };
    
     const handleIntervalChange = (value: string) => {
        const numberValue = parseInt(value, 10);
        if (!isNaN(numberValue) && numberValue >= 1) {
            taskDispatch({
                type: 'UPDATE_POMODORO_SETTINGS',
                payload: { longBreakInterval: numberValue }
            });
        }
    };

    const handleDragStart = (view: ViewType) => {
        setDraggedItem(view);
    };

    const handleDrop = (targetList: 'visible' | 'hidden') => {
        if (!draggedItem) return;

        const isVisible = bottomNavActions.includes(draggedItem);

        if (targetList === 'visible' && !isVisible) {
            if (bottomNavActions.length < 4) {
                setBottomNavActions([...bottomNavActions, draggedItem]);
            }
        } else if (targetList === 'hidden' && isVisible) {
            setBottomNavActions(bottomNavActions.filter(v => v !== draggedItem));
        }
        setDraggedItem(null);
    };

    const hiddenNavActions = ALL_FEATURES.filter(f => !bottomNavActions.includes(f.view)).map(f => f.view);

    const DraggableItem: React.FC<{ view: ViewType }> = ({ view }) => {
        const feature = ALL_FEATURES.find(f => f.view === view);
        if (!feature) return null;
        const Icon = feature.icon;
        return (
            <div
                draggable
                onDragStart={() => handleDragStart(view)}
                className="flex items-center gap-3 p-2 bg-secondary rounded-md cursor-grab active:cursor-grabbing"
            >
                <GripVerticalIcon className="h-5 w-5 text-muted-foreground" />
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{t(feature.label)}</span>
            </div>
        );
    };


    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="p-6 border-b border-border flex-shrink-0">
                <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
                <p className="text-muted-foreground">{t('settings.subtitle')}</p>
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-8 pb-20 md:pb-6">
                <section>
                    <h2 className="text-lg font-semibold mb-4">{t('settings.appearance')}</h2>
                    <div className="bg-card border border-border rounded-lg p-4 max-w-md">
                        <div className="flex items-center justify-between">
                            <label htmlFor="theme" className="font-medium">{t('settings.theme')}</label>
                            <div className="flex items-center gap-2 bg-secondary p-1 rounded-md">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded ${theme === 'light' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                                >
                                    <SunIcon className="h-4 w-4" /> {t('settings.theme.light')}
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded ${theme === 'dark' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                                >
                                    <MoonIcon className="h-4 w-4" /> {t('settings.theme.dark')}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-2">{t('settings.bottomNav.title')}</h2>
                    <p className="text-sm text-muted-foreground mb-4 max-w-xl">{t('settings.bottomNav.subtitle')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
                        <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop('visible')}
                            className="bg-card border border-border rounded-lg p-4"
                        >
                            <h3 className="font-semibold mb-3">{t('settings.bottomNav.visible')}</h3>
                            <div className="space-y-2 min-h-[100px]">
                                {bottomNavActions.map(view => <DraggableItem key={view} view={view} />)}
                            </div>
                        </div>
                        <div
                             onDragOver={(e) => e.preventDefault()}
                             onDrop={() => handleDrop('hidden')}
                             className="bg-card border border-border rounded-lg p-4"
                        >
                             <h3 className="font-semibold mb-3">{t('settings.bottomNav.hidden')}</h3>
                            <div className="space-y-2 min-h-[100px]">
                                {hiddenNavActions.map(view => <DraggableItem key={view} view={view} />)}
                            </div>
                        </div>
                    </div>
                </section>
                
                 <section>
                    <h2 className="text-lg font-semibold mb-4">{t('settings.pomodoro.title')}</h2>
                    <div className="bg-card border border-border rounded-lg p-4 max-w-md space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="focus-duration" className="font-medium text-sm">{t('settings.pomodoro.focusDuration')}</label>
                            <input
                                id="focus-duration"
                                type="number"
                                min="1"
                                value={pomodoroSettings.pomoDuration / 60}
                                onChange={(e) => handlePomodoroSettingChange('pomoDuration', e.target.value)}
                                className="w-20 p-1.5 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                            />
                        </div>
                         <div className="flex items-center justify-between">
                            <label htmlFor="short-break" className="font-medium text-sm">{t('settings.pomodoro.shortBreak')}</label>
                            <input
                                id="short-break"
                                type="number"
                                min="1"
                                value={pomodoroSettings.shortBreakDuration / 60}
                                onChange={(e) => handlePomodoroSettingChange('shortBreakDuration', e.target.value)}
                                className="w-20 p-1.5 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                            />
                        </div>
                         <div className="flex items-center justify-between">
                            <label htmlFor="long-break" className="font-medium text-sm">{t('settings.pomodoro.longBreak')}</label>
                            <input
                                id="long-break"
                                type="number"
                                min="1"
                                value={pomodoroSettings.longBreakDuration / 60}
                                onChange={(e) => handlePomodoroSettingChange('longBreakDuration', e.target.value)}
                                className="w-20 p-1.5 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                            />
                        </div>
                         <div className="flex items-center justify-between">
                            <label htmlFor="long-break-interval" className="font-medium text-sm">{t('settings.pomodoro.longBreakInterval')}</label>
                            <input
                                id="long-break-interval"
                                type="number"
                                min="1"
                                value={pomodoroSettings.longBreakInterval}
                                onChange={(e) => handleIntervalChange(e.target.value)}
                                className="w-20 p-1.5 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-4">{t('settings.language')}</h2>
                    <div className="bg-card border border-border rounded-lg p-4 max-w-md">
                         <div className="flex items-center justify-between">
                            <label htmlFor="language-select" className="font-medium">{t('settings.language')}</label>
                            <select
                                id="language-select"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
                                className="p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="en">{t('settings.language.en')}</option>
                                <option value="vi">{t('settings.language.vi')}</option>
                            </select>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default SettingsView;
