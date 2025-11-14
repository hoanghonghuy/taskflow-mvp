'use client'

import React, { useState } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Task, List } from '../../types';
import { useTranslation } from '../../hooks/useI18n';

interface WeekViewProps {
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

const isSameDay = (date1: Date, date2: Date): boolean => {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const WeekView: React.FC<WeekViewProps> = ({ currentDate, tasks, lists }) => {
    const { dispatch } = useTaskManager();
    const { t } = useTranslation();
    const [dragOverSlot, setDragOverSlot] = useState<{ day: Date; hour: number } | null>(null);
    
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1); // Start week on Monday
    
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const listColorMap = new Map(lists.map(l => [l.id, l.color]));

    const tasksWithTime = tasks.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        // Exclude tasks that might be midnight by convention but are all-day
        return d.getHours() !== 0 || d.getMinutes() !== 0;
    });

    const allDayTasks = tasks.filter(t => t.dueDate && !tasksWithTime.some(twt => twt.id === t.id));

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date, hour?: number) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            let newDueDate = new Date(day);
            if (hour !== undefined) {
                 newDueDate.setHours(hour, 0, 0, 0);
            } else {
                // Dropped in all-day section, keep original time or set to noon
                 const originalDate = task.dueDate ? new Date(task.dueDate) : new Date(day);
                 newDueDate.setHours(originalDate.getHours() || 12, originalDate.getMinutes(), 0, 0);
            }
           
            dispatch({
                type: 'UPDATE_TASK',
                payload: { ...task, dueDate: newDueDate.toISOString() }
            });
        }
        setDragOverSlot(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, day: Date, hour?: number) => {
        e.preventDefault();
        if (hour !== undefined) {
             setDragOverSlot({ day, hour });
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[auto_1fr] flex-shrink-0">
                <div className="w-14 text-xs text-center p-2 border-b border-border"></div>
                <div className="grid grid-cols-7 border-b border-border">
                    {days.map((day, dayIndex) => (
                        <div key={dayIndex} className="border-l border-border p-2 text-center">
                            <span className="font-semibold text-sm">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                            <p className={`text-xl font-bold ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>{day.getDate()}</p>
                        </div>
                    ))}
                </div>
            </div>
             {/* All-day section */}
            <div className="grid grid-cols-[auto_1fr] flex-shrink-0 border-b border-border">
                <div className="w-14 text-xs text-center py-2 flex items-center justify-center">{t('calendar.allDay')}</div>
                <div className="grid grid-cols-7">
                    {days.map((day, dayIndex) => (
                        <div key={dayIndex} className="border-l border-border p-1 overflow-hidden"
                            onDrop={(e) => handleDrop(e, day)}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="space-y-1 min-h-[20px]">
                                {allDayTasks
                                    .filter(t => isSameDay(new Date(t.dueDate!), day))
                                    .map(task => (
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
                        </div>
                    ))}
                </div>
            </div>


            {/* Timed section wrapper */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[auto_1fr] min-w-[700px] md:min-w-full">
                    {/* Time column */}
                    <div className="w-14 grid grid-rows-24">
                        {hours.map(hour => (
                            <div key={hour} className="row-start-auto text-xs text-right pr-2 text-muted-foreground h-16 border-t border-border flex items-start justify-end pt-1">
                                {hour > 0 ? new Date(0, 0, 0, hour).toLocaleTimeString(undefined, { hour: 'numeric', hour12: true }).toLowerCase() : ''}
                            </div>
                        ))}
                    </div>
                    {/* Main grid for timed events */}
                    <div className="grid grid-cols-7">
                        {days.map((day, dayIndex) => (
                            <div key={dayIndex} className="col-start-auto grid grid-rows-24 divide-y divide-border border-l border-border relative">
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        className={`row-start-auto h-full transition-colors ${dragOverSlot?.day.getTime() === day.getTime() && dragOverSlot.hour === hour ? 'bg-primary/10' : ''}`}
                                        onDrop={(e) => handleDrop(e, day, hour)}
                                        onDragOver={(e) => handleDragOver(e, day, hour)}
                                        onDragLeave={() => setDragOverSlot(null)}
                                    ></div>
                                ))}
                                {tasksWithTime
                                    .filter(t => isSameDay(new Date(t.dueDate!), day))
                                    .map(task => {
                                        const taskDate = new Date(task.dueDate!);
                                        const taskHour = taskDate.getHours();
                                        const taskMinutes = taskDate.getMinutes();
                                        const top = ((taskHour * 60 + taskMinutes) / (24 * 60)) * 100;
                                        return (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task.id)}
                                                onClick={() => dispatch({ type: 'SET_SELECTED_TASK', payload: task.id })}
                                                className={`absolute w-[calc(100%-4px)] text-xs p-1 rounded-md text-white cursor-pointer ml-[2px] z-10 overflow-hidden ${listColorMap.get(task.listId) || 'bg-gray-500'}`}
                                                style={{ top: `${top}%`, height: `4.166%` }} // 1 hour height
                                                title={task.title}
                                            >
                                                <p className="font-semibold truncate">{task.title}</p>
                                                <p>{taskDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                            </div>
                                        );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeekView;
