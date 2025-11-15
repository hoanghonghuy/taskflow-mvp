'use client'

import React, { useMemo, useState } from 'react';
import TaskItem from './TaskItem';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Task, SpecialList, SortOrder } from '../../types';
import { PlusIcon, EMPTY_STATE_ILLUSTRATIONS, ArrowUpIcon, ArrowDownIcon } from '../../constants';
import { useTranslation } from '../../hooks/useI18n';

interface TaskListProps {
    onAddTask: () => void;
}

// Helper functions for date calculations
const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const isTomorrow = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.getDate() === tomorrow.getDate() &&
           date.getMonth() === tomorrow.getMonth() &&
           date.getFullYear() === tomorrow.getFullYear();
};

const isFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const otherDate = new Date(date);
    otherDate.setHours(0, 0, 0, 0);
    return otherDate.getTime() > today.getTime();
}

const isOverdue = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() < today.getTime();
}

const groupUpcomingTasks = (tasks: Task[], t: (key: string) => string): { [key: string]: Task[] } => {
    const groups: { [key: string]: Task[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const endOfWeek = new Date(today);
    // Set to the upcoming Sunday
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()) % 7);

    tasks.forEach(task => {
        if (!task.dueDate) return;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // Skip non-future tasks
        if (dueDate < today) return;

        let groupKey: string;

        if (isTomorrow(dueDate)) {
            groupKey = t('specialLists.tomorrow'); // Using a key for "Tomorrow"
        } else if (dueDate > tomorrow && dueDate <= endOfWeek) {
            groupKey = dueDate.toLocaleDateString(undefined, { weekday: 'long' });
        } else {
            groupKey = dueDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(task);
    });

    return groups;
};


const TaskList: React.FC<TaskListProps> = ({ onAddTask }) => {
    const { state, dispatch } = useTaskManager();
    const { t } = useTranslation();
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [isCompletedOpen, setIsCompletedOpen] = useState(false);

    const filteredTasks = useMemo(() => {
        if (state.activeTag) {
            return state.tasks.filter(task => task.tags.includes(state.activeTag!));
        }

        switch (state.activeListId as SpecialList | string) {
            case 'today':
                 // A recurring task not completed and overdue should appear in 'Today'
                return state.tasks.filter(task => {
                    if (!task.dueDate) return false;
                    const taskDate = new Date(task.dueDate);
                     if (!task.completed && isOverdue(taskDate)) return true;
                    return isToday(taskDate);
                });
            case 'upcoming':
                return state.tasks.filter(task => task.dueDate && isFuture(new Date(task.dueDate)));
            case 'inbox':
                return state.tasks.filter(task => task.listId === 'inbox');
            default:
                return state.tasks.filter(task => task.listId === state.activeListId);
        }
    }, [state.tasks, state.activeListId, state.activeTag]);

    const sortTasks = (tasks: Task[], sortOrder: SortOrder): Task[] => {
        if (sortOrder === 'default') {
            return [...tasks].sort((a, b) => {
                const aIsRecurringInstance = a.id.includes('_');
                const bIsRecurringInstance = b.id.includes('_');
                const originalAId = aIsRecurringInstance ? a.id.split('_')[0] : a.id;
                const originalBId = bIsRecurringInstance ? b.id.split('_')[0] : b.id;

                const aIndex = state.tasks.findIndex(t => t.id === originalAId);
                const bIndex = state.tasks.findIndex(t => t.id === originalBId);
                return aIndex - bIndex;
            });
        }

        return [...tasks].sort((a, b) => {
            const aHasDate = !!a.dueDate;
            const bHasDate = !!b.dueDate;

            if (aHasDate && !bHasDate) return -1;
            if (!aHasDate && bHasDate) return 1;
            if (!aHasDate && !bHasDate) return 0;

            const dateA = new Date(a.dueDate!).getTime();
            const dateB = new Date(b.dueDate!).getTime();

            return sortOrder === 'dueDateAsc' ? dateA - dateB : dateB - dateA;
        });
    };
    
    const uncompletedTasks = sortTasks(filteredTasks.filter(task => !task.completed), state.sortOrder);
    const completedTasks = sortTasks(filteredTasks.filter(task => task.completed), state.sortOrder);
    
    const groupedUpcomingTasks = useMemo(() => {
        if (state.activeListId !== 'upcoming') return null;
        return groupUpcomingTasks(uncompletedTasks, t);
    }, [state.activeListId, uncompletedTasks, t]);

    const upcomingGroupOrder = useMemo(() => {
        if (!groupedUpcomingTasks) return [];
        return Object.keys(groupedUpcomingTasks).sort((a, b) => {
            const earliestA = Math.min(...groupedUpcomingTasks[a].map(t => new Date(t.dueDate!).getTime()));
            const earliestB = Math.min(...groupedUpcomingTasks[b].map(t => new Date(t.dueDate!).getTime()));
            return earliestA - earliestB;
        });
    }, [groupedUpcomingTasks]);


    const handleDragStart = (taskId: string) => {
        setDraggedTaskId(taskId);
    };

    const handleDrop = (droppedOnId: string) => {
        if (draggedTaskId && draggedTaskId !== droppedOnId) {
            dispatch({ type: 'REORDER_TASKS', payload: { draggedId: draggedTaskId, droppedOnId } });
        }
        setDraggedTaskId(null);
    };

    if (filteredTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                {EMPTY_STATE_ILLUSTRATIONS.noTasks}
                <h2 className="text-xl font-semibold">{t('taskList.allDone')}</h2>
                <p>{t('taskList.noTasks')}</p>
            </div>
        );
    }
    
    const renderTaskItems = (tasks: Task[]) => (
        tasks.map(task => (
            <TaskItem 
                key={task.id} 
                task={task}
                isDraggable={state.sortOrder === 'default' && state.activeListId !== 'upcoming'}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
            />
        ))
    );

    return (
        <div className="space-y-4">
            <div
                onDragOver={(e) => e.preventDefault()}
            >
                {groupedUpcomingTasks ? (
                    upcomingGroupOrder.map(groupName => (
                        groupedUpcomingTasks[groupName] && (
                            <div key={groupName} className="mb-6">
                                <h3 className="text-md font-semibold mb-2 text-primary">{groupName}</h3>
                                <div className="space-y-2">
                                    {renderTaskItems(groupedUpcomingTasks[groupName])}
                                </div>
                            </div>
                        )
                    ))
                ) : (
                    <div className="space-y-2">
                        {renderTaskItems(uncompletedTasks)}
                    </div>
                )}
                 <button 
                    onClick={onAddTask}
                    className="w-full flex items-center gap-2 p-3 mt-4 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{t('taskList.addTask')}</span>
                </button>
            </div>
            {completedTasks.length > 0 && (
                <div>
                    <button 
                        onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-muted-foreground mb-2 py-1"
                    >
                        <span>{t('taskList.completed')} ({completedTasks.length})</span>
                        {isCompletedOpen ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                    </button>
                    {isCompletedOpen && (
                        <div className="space-y-2 animate-accordion-down overflow-hidden">
                            {completedTasks.map(task => (
                                <TaskItem key={task.id} task={task} isDraggable={false} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskList;
