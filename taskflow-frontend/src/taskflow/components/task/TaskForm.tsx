'use client'

import React, { useState, useEffect } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Task, Priority } from '../../types';
import { CloseIcon, SparklesIcon, PRIORITY_MAP } from '../../constants';
import { analyzeTextForTask } from '../../services/geminiService';
import Spinner from '../ui/Spinner';
import { useTranslation } from '../../hooks/useI18n';
import { useGemini } from '../../hooks/useGemini';
import { useToast } from '../../hooks/useToast';

interface TaskFormProps {
    onClose: () => void;
    defaultValues?: {
        listId?: string;
        columnId?: string;
    }
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, defaultValues }) => {
    const { state, dispatch } = useTaskManager();
    const { t } = useTranslation();
    const { ai, isAvailable: isGeminiAvailable } = useGemini();
    const addToast = useToast();

    const getInitialListId = () => {
        const initial = defaultValues?.listId || state.activeListId;
        // Special lists other than inbox are not selectable in the form. Default to inbox.
        if (initial === 'today' || initial === 'upcoming') {
            return 'inbox';
        }
        // Ensure the list exists, otherwise default to inbox
        const listExists = state.lists.some(l => l.id === initial);
        if (initial !== 'inbox' && !listExists) {
            return 'inbox';
        }
        return initial;
    };

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.None);
    const [listId, setListId] = useState(getInitialListId());
    const [columnId, setColumnId] = useState(defaultValues?.columnId);
    const [textToAnalyze, setTextToAnalyze] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    useEffect(() => {
        // Ensure columnId is valid for the selected listId, or clear it
        const columnsForList = state.columns.filter(c => c.listId === listId);
        if (columnId && !columnsForList.some(c => c.id === columnId)) {
            setColumnId(columnsForList[0]?.id);
        } else if (!columnId) {
             setColumnId(columnsForList[0]?.id);
        }
    }, [listId, columnId, state.columns]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            const newTask: Task = {
                id: Date.now().toString(),
                title: title.trim(),
                description: description.trim(),
                completed: false,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                priority,
                listId: listId || 'inbox',
                columnId: columnId,
                tags: [],
                subtasks: [],
                createdAt: new Date().toISOString(),
                totalFocusTime: 0,
            };
            dispatch({ type: 'ADD_TASK', payload: newTask });
            onClose();
        }
    };
    
    const handleAnalyzeText = async () => {
        if (!textToAnalyze.trim() || !ai) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeTextForTask(ai, textToAnalyze);
            if(result.title) setTitle(result.title);
            if(result.description) setDescription(result.description);
            if(result.dueDate) setDueDate(new Date(result.dueDate).toISOString().split('T')[0]);
            // Subtasks can be added in detail view
            setTextToAnalyze('');
        } catch (error: any) {
            addToast(error.message || 'Failed to analyze text', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('taskForm.newTask')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
                        <CloseIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    {isGeminiAvailable && (
                        <div className="mb-4 p-4 border border-dashed border-border rounded-lg">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('taskForm.createWithGemini')}</label>
                            <textarea
                                value={textToAnalyze}
                                onChange={e => setTextToAnalyze(e.target.value)}
                                placeholder={t('taskForm.geminiPlaceholder')}
                                rows={3}
                                className="w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button onClick={handleAnalyzeText} disabled={isAnalyzing} className="mt-2 w-full text-sm flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-secondary hover:bg-muted transition-colors disabled:opacity-50">
                                {isAnalyzing ? <Spinner /> : <SparklesIcon className="h-4 w-4 text-primary" />}
                                {t('taskForm.analyzeAndFill')}
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">{t('taskForm.titleLabel')}</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder={t('taskForm.titlePlaceholder')}
                                className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">{t('taskForm.descriptionLabel')}</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                placeholder={t('taskForm.descriptionPlaceholder')}
                                className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">{t('taskForm.dueDateLabel')}</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">{t('taskForm.priorityLabel')}</label>
                                <select value={priority} onChange={e => setPriority(parseInt(e.target.value) as Priority)} className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    {Object.entries(PRIORITY_MAP).map(([p, { label }]) => (
                                        <option key={p} value={p}>{t(label)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">{t('taskForm.listLabel')}</label>
                            <select value={listId} onChange={e => setListId(e.target.value)} className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                <option value="inbox">{t('specialLists.inbox')}</option>
                                {state.lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                            </select>
                        </div>
                    </form>
                </div>

                <footer className="p-4 border-t border-border flex justify-end">
                    <button onClick={handleSubmit} type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90">
                        {t('taskForm.createTask')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TaskForm;
