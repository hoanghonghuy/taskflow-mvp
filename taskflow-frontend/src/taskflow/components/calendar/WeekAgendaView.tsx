'use client'

import React from 'react';
// FIX: Import 'List' type to resolve type error.
import { Task, List } from '../../types';
import TaskItem from '../task/TaskItem';

interface WeekAgendaViewProps {
    currentDate: Date;
    tasks: Task[];
    lists: List[];
}

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

const WeekAgendaView: React.FC<WeekAgendaViewProps> = ({ currentDate, tasks }) => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1); // Start week on Monday

    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <div className="p-4 space-y-6 pb-20">
            {days.map(day => {
                const tasksForDay = tasks
                    .filter(task => task.dueDate && isSameDay(new Date(task.dueDate), day))
                    .sort((a, b) => {
                        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                        return dateA - dateB;
                    });
                
                const isToday = isSameDay(day, new Date());

                return (
                    <div key={day.toISOString()}>
                        <div className="flex items-baseline gap-3 mb-2">
                             <h2 className={`font-bold text-lg ${isToday ? 'text-primary' : ''}`}>
                                {day.toLocaleDateString(undefined, { weekday: 'long' })}
                            </h2>
                            <p className={`text-sm ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                                {day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                        {tasksForDay.length > 0 ? (
                            <div className="space-y-2 border-l-2 border-border pl-4 ml-2">
                                {tasksForDay.map(task => (
                                    <TaskItem key={task.id} task={task} isDraggable={false} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic pl-4 ml-2">No tasks scheduled.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default WeekAgendaView;
