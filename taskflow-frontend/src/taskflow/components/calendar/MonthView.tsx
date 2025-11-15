'use client'

import React from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Task, List } from '../../types';
import { useTranslation } from '../../hooks/useI18n';

interface MonthViewProps {
    currentDate: Date;
    tasks: Task[];
    lists: List[];
}

// Helper functions to replace date-fns
const addDays = (date: Date, amount: number): Date => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + amount);
    return newDate;
};

const isSameMonth = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const MonthView: React.FC<MonthViewProps> = ({ currentDate, tasks, lists }) => {
    const { dispatch } = useTaskManager();
    const { t } = useTranslation();
    
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1); // Start week on Monday
    
    const endDate = new Date(monthEnd);
    if (endDate.getDay() !== 0) { // end week on Sunday
        endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
    }


    const listColorMap = new Map(lists.map(l => [l.id, l.color]));

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const originalDate = task.dueDate ? new Date(task.dueDate) : new Date();
            const newDueDate = new Date(day);
            // Preserve the original time
            newDueDate.setHours(originalDate.getHours());
            newDueDate.setMinutes(originalDate.getMinutes());
            newDueDate.setSeconds(originalDate.getSeconds());

            dispatch({
                type: 'UPDATE_TASK',
                payload: { ...task, dueDate: newDueDate.toISOString() }
            });
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const renderCells = () => {
        const rows = [];
        let days = [];
        let day = new Date(startDate);

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = new Date(day);
                const tasksForDay = tasks.filter(task =>
                    task.dueDate && new Date(task.dueDate).toDateString() === cloneDay.toDateString()
                );

                days.push(
                    <div
                        key={day.toString()}
                        className={`flex-1 border-r border-b border-border p-2 min-h-[100px] sm:min-h-[120px] overflow-hidden ${!isSameMonth(day, monthStart) ? 'bg-muted/30 text-muted-foreground' : ''}`}
                        onDrop={(e) => handleDrop(e, cloneDay)}
                        onDragOver={handleDragOver}
                    >
                        <span className={`text-sm ${isToday(day) ? 'bg-primary text-primary-foreground rounded-full px-2 py-1 font-bold' : ''}`}>
                            {cloneDay.getDate()}
                        </span>
                        <div className="mt-2">
                             <div className="hidden sm:block space-y-1">
                                {tasksForDay.slice(0, 2).map(task => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onClick={() => dispatch({ type: 'SET_SELECTED_TASK', payload: task.id })}
                                        className={`text-xs p-1 rounded-md text-white cursor-pointer truncate ${listColorMap.get(task.listId) || 'bg-gray-500'}`}
                                        title={task.title}
                                    >
                                        {task.title}
                                    </div>
                                ))}
                            </div>
                             <div className="flex flex-wrap items-center gap-1 sm:hidden">
                                {tasksForDay.slice(0, 5).map(task => (
                                    <div key={task.id} className={`w-2 h-2 rounded-full ${listColorMap.get(task.listId) || 'bg-gray-500'}`} title={task.title} />
                                ))}
                            </div>
                            {tasksForDay.length > 2 && (
                                <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                                    {t('calendar.moreTasks', { count: tasksForDay.length - 2 })}
                                </div>
                            )}
                            {tasksForDay.length > 5 && (
                                <div className="text-xs text-muted-foreground mt-1 sm:hidden">
                                    {t('calendar.moreTasks', { count: tasksForDay.length - 5 })}
                                </div>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="flex" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return rows;
    };
    
    const dayNames = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(2024, 0, 1 + i); // 2024-01-01 is a Monday
        return day.toLocaleDateString(undefined, { weekday: 'short' });
    });

    return (
        <div className="flex flex-col h-full">
            <div className="flex border-b border-border">
                {dayNames.map(name => (
                    <div key={name} className="flex-1 text-center font-semibold text-sm py-2 border-r border-border last:border-r-0">
                        {name}
                    </div>
                ))}
            </div>
            <div className="flex-grow">{renderCells()}</div>
        </div>
    );
};

export default MonthView;
