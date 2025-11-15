'use client'

import React, { useState, useMemo } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Task } from '../../types';
import { PlusIcon } from '../../constants';
import FocusTaskPicker from './FocusTaskPicker';
import { useTranslation } from '../../hooks/useI18n';


const PomodoroView: React.FC = () => {
    const { state, dispatch } = useTaskManager();
    const { t } = useTranslation();
    const { pomodoro } = state;
    const [isTaskPickerOpen, setTaskPickerOpen] = useState(false);
    
    const focusedTask = useMemo(() => 
        state.tasks.find(t => t.id === pomodoro.focusedTaskId),
        [state.tasks, pomodoro.focusedTaskId]
    );
    
    const today = new Date().toISOString().split('T')[0];
    const todaysFocusRecords = pomodoro.focusHistory.filter(r => r.startTime.startsWith(today));
    const totalPomosToday = todaysFocusRecords.length;
    const totalFocusDurationToday = todaysFocusRecords.reduce((acc, curr) => acc + curr.duration, 0);


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const handlePauseResume = () => {
        if (pomodoro.isPaused || !pomodoro.isActive) {
            dispatch({ type: 'START_TIMER' });
        } else {
            dispatch({ type: 'PAUSE_TIMER' });
        }
    };

    const handleStop = () => {
        dispatch({ type: 'STOP_TIMER' });
    };

    const getSessionName = () => {
        switch (pomodoro.currentSession) {
            case 'pomo': return t('pomodoro.focus');
            case 'shortBreak': return t('pomodoro.shortBreak');
            case 'longBreak': return t('pomodoro.longBreak');
        }
    };
    
    const totalDuration = pomodoro.settings[`${pomodoro.currentSession}Duration`];
    const progress = totalDuration > 0 ? (totalDuration - pomodoro.remainingTime) / totalDuration : 0;

    return (
        <>
            <div className="flex flex-col md:flex-row h-full w-full pb-16 md:pb-0">
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                    <div className="text-center mb-6">
                        <p className="text-lg text-muted-foreground mb-2">
                            {getSessionName()} {pomodoro.currentSession === 'pomo' && `(#${pomodoro.currentCycle + 1})`}
                        </p>
                        <div 
                            className="text-xl md:text-2xl font-semibold min-h-[32px] cursor-pointer hover:bg-secondary p-2 rounded-md"
                            onClick={() => setTaskPickerOpen(true)}
                        >
                            {focusedTask ? t('pomodoro.focusingOn', { taskTitle: focusedTask.title }) : t('pomodoro.selectTask')}
                        </div>
                    </div>

                    <div className="relative w-60 h-60 md:w-72 md:h-72 flex items-center justify-center mb-8">
                        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-secondary" strokeWidth="5" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                            <circle
                                className="text-primary transition-all duration-1000 ease-linear"
                                strokeWidth="5"
                                strokeDasharray={2 * Math.PI * 45}
                                strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="45"
                                cx="50"
                                cy="50"
                                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                            />
                        </svg>
                        <span className="text-5xl md:text-6xl font-bold font-mono tracking-tighter">
                            {formatTime(pomodoro.remainingTime)}
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={handleStop}
                            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-full text-md md:text-lg font-semibold hover:bg-muted"
                        >
                            {t('pomodoro.stop')}
                        </button>
                        <button 
                            onClick={handlePauseResume}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-full text-md md:text-lg font-semibold hover:bg-primary/90 w-32"
                        >
                            {pomodoro.isPaused || !pomodoro.isActive ? t('pomodoro.start') : t('pomodoro.pause')}
                        </button>
                    </div>
                </div>
                <aside className="w-full md:w-80 bg-card border-t md:border-l md:border-t-0 border-border p-6 flex-shrink-0 flex flex-col h-1/3 md:h-full">
                    <h2 className="text-xl font-bold mb-4">{t('pomodoro.overview')}</h2>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">{t('pomodoro.todayPomos')}</p>
                            <p className="text-2xl font-bold">{totalPomosToday}</p>
                        </div>
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">{t('pomodoro.totalFocus')}</p>
                            <p className="text-2xl font-bold">{formatDuration(totalFocusDurationToday)}</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold mb-4">{t('pomodoro.focusRecord')}</h2>
                    <div className="flex-1 overflow-y-auto pr-2">
                        {todaysFocusRecords.length > 0 ? (
                            <ul className="space-y-3">
                                {todaysFocusRecords.slice().reverse().map((record) => {
                                    const task = state.tasks.find(t => t.id === record.taskId);
                                    return (
                                    <li key={record.startTime} className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-semibold truncate max-w-[150px]">{task ? task.title : t('pomodoro.generalFocus')}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(record.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(record.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <span className="font-mono text-muted-foreground">{formatDuration(record.duration)}</span>
                                    </li>
                                )})}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center mt-8">{t('pomodoro.noRecords')}</p>
                        )}
                    </div>
                </aside>
            </div>
            {isTaskPickerOpen && <FocusTaskPicker onClose={() => setTaskPickerOpen(false)} />}
        </>
    );
};

export default PomodoroView;
