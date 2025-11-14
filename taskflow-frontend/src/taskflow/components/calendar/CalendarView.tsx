'use client'

import React, { useState } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { ChevronLeftIcon, ChevronRightIcon } from '../../constants';
import MonthView from './MonthView';
import WeekView from './WeekView';
import { useTranslation } from '../../hooks/useI18n';
import WeekAgendaView from './WeekAgendaView';

type CalendarViewType = 'month' | 'week';

const CalendarView: React.FC = () => {
    const { state } = useTaskManager();
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<CalendarViewType>('month');

    const next = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (viewType === 'month') {
                newDate.setMonth(newDate.getMonth() + 1);
            } else {
                newDate.setDate(newDate.getDate() + 7);
            }
            return newDate;
        });
    };

    const prev = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (viewType === 'month') {
                 newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setDate(newDate.getDate() - 7);
            }
            return newDate;
        });
    };
    
    const goToToday = () => setCurrentDate(new Date());

    const getHeaderText = () => {
        if (viewType === 'month') {
            return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        }
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        if (weekStart.getMonth() === weekEnd.getMonth()) {
            return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        }
        return `${weekStart.toLocaleDateString(undefined, { month: 'short' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
    };

    return (
        <div className="flex-1 flex flex-col">
            <header className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-border gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h1 className="text-xl md:text-2xl font-bold truncate">{getHeaderText()}</h1>
                    <div className="flex items-center gap-1">
                        <button onClick={prev} className="p-2 rounded-md hover:bg-secondary">
                            <ChevronLeftIcon className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <button onClick={goToToday} className="px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-secondary border border-border">
                            {t('calendar.today')}
                        </button>
                        <button onClick={next} className="p-2 rounded-md hover:bg-secondary">
                            <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-secondary p-1 rounded-md">
                     <button 
                        onClick={() => setViewType('month')}
                        className={`px-3 py-1 text-sm font-semibold rounded ${viewType === 'month' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                    >
                        {t('calendar.month')}
                    </button>
                    <button 
                        onClick={() => setViewType('week')}
                        className={`px-3 py-1 text-sm font-semibold rounded ${viewType === 'week' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                    >
                        {t('calendar.week')}
                    </button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto md:overflow-hidden">
                {viewType === 'month' ? (
                    <MonthView currentDate={currentDate} tasks={state.tasks} lists={state.lists} />
                ) : (
                    <>
                        <div className="hidden md:block h-full">
                           <WeekView currentDate={currentDate} tasks={state.tasks} lists={state.lists} />
                        </div>
                         <div className="block md:hidden">
                           <WeekAgendaView currentDate={currentDate} tasks={state.tasks} lists={state.lists} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CalendarView;
