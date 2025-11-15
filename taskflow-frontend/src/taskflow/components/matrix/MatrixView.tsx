'use client'

import React, { useMemo } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Task, Priority } from '../../types';
import TaskItem from '../task/TaskItem';
import { useTranslation } from '../../hooks/useI18n';

const Quadrant: React.FC<{ title: string; subtitle: string; tasks: Task[]; className?: string }> = ({ title, subtitle, tasks, className }) => {
    const { t } = useTranslation();
    
    return (
        <div className={`p-4 rounded-lg flex flex-col bg-card border border-border ${className}`}>
            <div className="mb-4">
                <h3 className="font-bold">{title}</h3>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {tasks.length > 0 ? (
                    tasks.map(task => <TaskItem key={task.id} task={task} isDraggable={false} />)
                ) : (
                    <div className="text-center text-sm text-muted-foreground pt-8">{t('matrix.empty')}</div>
                )}
            </div>
        </div>
    );
};

const MatrixView: React.FC = () => {
    const { state } = useTaskManager();
    const { t } = useTranslation();
    const tasks = state.tasks.filter(t => !t.completed);

    const categorizedTasks = useMemo(() => {
        const urgentImportant = tasks.filter(t => t.priority === Priority.High);
        const notUrgentImportant = tasks.filter(t => t.priority === Priority.Low);
        const urgentNotImportant = tasks.filter(t => t.priority === Priority.Medium);
        const notUrgentNotImportant = tasks.filter(t => t.priority === Priority.None);
        return { urgentImportant, notUrgentImportant, urgentNotImportant, notUrgentNotImportant };
    }, [tasks]);

    return (
        <div className="flex-1 flex flex-col">
            <header className="flex-shrink-0 p-6 border-b border-border">
                <h1 className="text-2xl font-bold">{t('matrix.title')}</h1>
                <p className="text-muted-foreground">{t('matrix.subtitle')}</p>
            </header>
            <main className="flex-1 grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
                <Quadrant 
                    title={t('matrix.q1.title')}
                    subtitle={t('matrix.q1.subtitle')}
                    tasks={categorizedTasks.urgentImportant} 
                    className="border-red-500/50"
                />
                <Quadrant 
                    title={t('matrix.q2.title')}
                    subtitle={t('matrix.q2.subtitle')} 
                    tasks={categorizedTasks.notUrgentImportant} 
                    className="border-blue-500/50"
                />
                <Quadrant 
                    title={t('matrix.q3.title')}
                    subtitle={t('matrix.q3.subtitle')}
                    tasks={categorizedTasks.urgentNotImportant} 
                    className="border-yellow-500/50"
                />
                <Quadrant 
                    title={t('matrix.q4.title')} 
                    subtitle={t('matrix.q4.subtitle')}
                    tasks={categorizedTasks.notUrgentNotImportant} 
                    className="border-gray-500/50"
                />
            </main>
        </div>
    );
};

export default MatrixView;
