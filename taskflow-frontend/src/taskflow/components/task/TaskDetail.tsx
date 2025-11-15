'use client'

import React, { useState, useEffect } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Task, Subtask, Priority, Comment } from '../../types';
import { PRIORITY_MAP, CloseIcon, SparklesIcon, GlobeAltIcon, GripVerticalIcon, PlayCircleIcon, StopwatchIcon, RepeatIcon, CheckIcon, ChatBubbleOvalLeftEllipsisIcon } from '../../constants';
import { generateSubtasks, getGroundedInfo } from '../../services/geminiService';
import Spinner from '../ui/Spinner';
import DatePicker from '../ui/DatePicker';
import RecurrencePicker from '../ui/RecurrencePicker';
import ReminderSetter from '../ui/ReminderSetter';
import { useTranslation } from '../../hooks/useI18n';
import { useGemini } from '../../hooks/useGemini';
import { useToast } from '../../hooks/useToast';
import AssigneePicker from '../collaboration/AssigneePicker';
import CommentSection from '../collaboration/CommentSection';


interface TaskDetailProps {
    taskId: string;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId }) => {
    const { state, dispatch } = useTaskManager();
    const { t } = useTranslation();
    const { ai, isAvailable: isGeminiAvailable } = useGemini();
    const addToast = useToast();
    const [task, setTask] = useState<Task | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [newSubtask, setNewSubtask] = useState('');
    const [newTag, setNewTag] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [draggedTagIndex, setDraggedTagIndex] = useState<number | null>(null);

    useEffect(() => {
        const foundTask = state.tasks.find(t => t.id === taskId);
        setTask(foundTask || null);
    }, [taskId, state.tasks]);

    if (!task) {
        return null;
    }
    
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;

    const formatFocusTime = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m`;
        return result.trim();
    };

    const handleClose = () => dispatch({ type: 'SET_SELECTED_TASK', payload: null });
    
    const updateTask = (updates: Partial<Task>) => {
        if (!task) return;
        const updatedTask = { ...task, ...updates };
        setTask(updatedTask); // Local update for responsiveness
        // Debounced update would be ideal here in a real app
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    };

    const handleStartFocus = () => {
        dispatch({ type: 'SET_FOCUSED_TASK', payload: task.id });
        dispatch({ type: 'START_TIMER' });
        dispatch({ type: 'SET_VIEW', payload: 'pomodoro' });
        handleClose();
    };
    
    const handleSubtaskChange = (subtaskId: string, completed: boolean) => {
        const newSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, completed } : st);
        updateTask({ subtasks: newSubtasks });
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if(newSubtask.trim()){
            const subtask: Subtask = { id: Date.now().toString(), title: newSubtask.trim(), completed: false };
            updateTask({ subtasks: [...task.subtasks, subtask] });
            setNewSubtask('');
        }
    };

    const handleGenerateSubtasks = async () => {
        if (!task || !ai) return;
        setIsGenerating(true);
        try {
            const generated = await generateSubtasks(ai, task.title);
            const newSubtasks = generated.map((title, i) => ({ id: `gen-${Date.now()}-${i}`, title, completed: false }));
            updateTask({ subtasks: [...task.subtasks, ...newSubtasks] });
        } catch (error: any) {
            addToast(error.message || 'Failed to generate subtasks', 'error');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGetGroundedInfo = async () => {
        if (!task || !ai) return;
        setIsSearching(true);
        try {
            const { summary, sources } = await getGroundedInfo(ai, task.title);
            const formattedSources = sources.map(s => `- [${s.title}](${s.uri})`).join('\n');
            const newDescription = `${task.description || ''}\n\n**Related Information (from Gemini):**\n${summary}\n\n**Sources:**\n${formattedSources}`;
            updateTask({ description: newDescription.trim(), groundingSources: sources });
        } catch (error: any) {
            addToast(error.message || 'Failed to get info', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            const trimmedTag = newTag.trim().toLowerCase();
            if (trimmedTag && !task.tags.includes(trimmedTag)) {
                updateTask({ tags: [...task.tags, trimmedTag] });
            }
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        updateTask({ tags: task.tags.filter(tag => tag !== tagToRemove) });
    };

    const handleAssignTask = (userId: string | null) => {
        dispatch({ type: 'ASSIGN_TASK', payload: { taskId: task.id, userId } });
    };

    const handleAddComment = (content: string) => {
        const newComment: Comment = {
            id: Date.now().toString(),
            userId: 'user-001', // Should be the current user's ID
            content,
            createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_COMMENT', payload: { taskId: task.id, comment: newComment } });
    };

    // Drag and Drop handlers for subtasks and tags
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) { setDraggedIndex(null); return; }
        const newSubtasks = [...task.subtasks];
        const [draggedItem] = newSubtasks.splice(draggedIndex, 1);
        newSubtasks.splice(dropIndex, 0, draggedItem);
        updateTask({ subtasks: newSubtasks });
        setDraggedIndex(null);
    };
    const handleDragEnd = () => setDraggedIndex(null);
    const handleTagDragStart = (e: React.DragEvent<HTMLSpanElement>, index: number) => { setDraggedTagIndex(index); e.dataTransfer.effectAllowed = 'move'; };
    const handleTagDragOver = (e: React.DragEvent<HTMLSpanElement>) => e.preventDefault();
    const handleTagDrop = (e: React.DragEvent<HTMLSpanElement>, dropIndex: number) => {
        e.preventDefault();
        if (draggedTagIndex === null || draggedTagIndex === dropIndex) { setDraggedTagIndex(null); return; }
        const newTags = [...task.tags];
        const [draggedItem] = newTags.splice(draggedTagIndex, 1);
        newTags.splice(dropIndex, 0, draggedItem);
        updateTask({ tags: newTags });
        setDraggedTagIndex(null);
    };
    const handleTagDragEnd = () => setDraggedTagIndex(null);
    
    const recurrenceText = task.recurrence ? t(`recurrence.${task.recurrence.rule}`) : '';

    return (
        <div className="h-full w-full md:w-96 bg-card border-l border-border shadow-2xl flex flex-col md:animate-slide-in">
            <header className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { taskId: task.id } })}
                        aria-label={task.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
                        className={`
                            h-5 w-5 rounded flex-shrink-0
                            flex items-center justify-center 
                            transition-all duration-150
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                            ${task.completed 
                                ? 'bg-primary border-2 border-primary' 
                                : 'bg-transparent border-2 border-muted-foreground/50'
                            }
                        `}
                    >
                        {task.completed && <CheckIcon className="h-3.5 w-3.5 text-primary-foreground" />}
                    </button>
                    <label 
                        onClick={() => dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { taskId: task.id } })}
                        className="text-sm text-muted-foreground cursor-pointer"
                    >
                        {task.completed ? t('taskDetail.completed') : t('taskDetail.markComplete')}
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-secondary">
                        <CloseIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>
            </header>

            <div className="flex-grow p-6 overflow-y-auto">
                <input
                    type="text"
                    value={task.title}
                    onChange={(e) => updateTask({ title: e.target.value })}
                    className="text-2xl font-bold bg-transparent w-full focus:outline-none focus:bg-secondary/50 rounded-md p-2"
                />
                
                 {task.recurrence && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground p-2 bg-secondary/50 rounded-md">
                        <RepeatIcon className="h-4 w-4" />
                        <span>{t('taskDetail.recurringInfo', { rule: recurrenceText })}</span>
                    </div>
                )}
                
                {task.totalFocusTime > 0 && (
                     <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground p-2">
                        <StopwatchIcon className="h-5 w-5" />
                        <span dangerouslySetInnerHTML={{ __html: t('taskDetail.focusTime', { time: formatFocusTime(task.totalFocusTime) }) }} />
                    </div>
                )}

                <div className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="task-description" className="text-sm font-medium text-muted-foreground">{t('taskDetail.descriptionLabel')}</label>
                        <textarea
                            id="task-description"
                            value={task.description || ''}
                            onChange={(e) => updateTask({ description: e.target.value })}
                            rows={4}
                            placeholder={t('taskDetail.descriptionPlaceholder')}
                            className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                     {task.groundingSources && task.groundingSources.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('taskDetail.sourcesLabel')}</h4>
                            <ul className="space-y-1">
                                {task.groundingSources.map((source, index) => (
                                    <li key={index} className="text-sm">
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
                                            {source.title || source.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}


                    <div className="grid grid-cols-2 gap-4">
                         <AssigneePicker
                            currentAssigneeId={task.assigneeId}
                            onAssign={handleAssignTask}
                        />
                         <div>
                            <label htmlFor="task-priority" className="text-sm font-medium text-muted-foreground">{t('taskDetail.priorityLabel')}</label>
                            <select
                                id="task-priority"
                                value={task.priority}
                                onChange={(e) => updateTask({ priority: parseInt(e.target.value) as Priority })}
                                className="w-full mt-1 p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                            >
                                {Object.entries(PRIORITY_MAP).map(([p, { label }]) => (
                                    <option key={p} value={p}>{t(label)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <DatePicker
                            value={task.dueDate}
                            onChange={(date) => updateTask({ dueDate: date ? date.toISOString() : undefined })}
                        />
                        <RecurrencePicker 
                            recurrence={task.recurrence} 
                            onChange={(r) => dispatch({ type: 'SET_TASK_RECURRENCE', payload: { taskId: task.id, recurrence: r } })}
                        />
                    </div>

                    <div className="grid grid-cols-1">
                         <ReminderSetter
                            reminder={task.reminderMinutes}
                            onChange={(m) => dispatch({ type: 'SET_TASK_REMINDER', payload: { taskId: task.id, reminderMinutes: m }})}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="tag-input" className="text-sm font-medium text-muted-foreground">{t('taskDetail.tagsLabel')}</label>
                        <div className="mt-2 flex flex-wrap gap-2 items-center p-2 bg-secondary/50 rounded-md">
                            {task.tags.map((tag, index) => (
                                <span 
                                    key={tag}
                                    draggable
                                    onDragStart={(e) => handleTagDragStart(e, index)}
                                    onDragOver={handleTagDragOver}
                                    onDrop={(e) => handleTagDrop(e, index)}
                                    onDragEnd={handleTagDragEnd}
                                    className={`flex items-center gap-1 bg-secondary px-2 py-1 rounded-full text-xs font-medium cursor-move transition-opacity ${draggedTagIndex === index ? 'opacity-50' : 'opacity-100'}`}>
                                    {tag}
                                    <button onClick={() => handleRemoveTag(tag)} className="rounded-full hover:bg-muted-foreground/20 z-10">
                                        <CloseIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                id="tag-input"
                                type="text"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder={t('taskDetail.tagsPlaceholder')}
                                className="flex-grow bg-transparent text-sm focus:outline-none"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t('taskDetail.tagsHelper')}</p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                             <h3 className="text-sm font-medium text-muted-foreground">{t('taskDetail.subtasksLabel')}</h3>
                             {isGeminiAvailable && (
                                <button onClick={handleGenerateSubtasks} disabled={isGenerating} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 disabled:opacity-50">
                                    {isGenerating ? <Spinner className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                                    {t('taskDetail.generateButton')}
                                </button>
                             )}
                        </div>
                        {task.subtasks.length > 0 && (
                            <div className="my-2">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>{t('taskDetail.progressLabel')}</span>
                                    <span>{completedSubtasks} / {task.subtasks.length}</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        <div className="mt-2 space-y-2">
                            {isGenerating && (
                                <div className="space-y-2">
                                    <div className="h-10 bg-secondary/50 rounded-md animate-pulse"></div>
                                    <div className="h-10 bg-secondary/50 rounded-md animate-pulse delay-75"></div>
                                </div>
                            )}
                            {task.subtasks.map((st, index) => (
                                <div 
                                    key={st.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-2 p-2 bg-secondary/50 rounded-md transition-opacity group ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
                                >
                                    <GripVerticalIcon className="h-5 w-5 text-muted-foreground/50 cursor-move group-hover:text-muted-foreground" />
                                    <button
                                        onClick={() => handleSubtaskChange(st.id, !st.completed)}
                                        aria-label={st.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
                                        className={`
                                            h-4 w-4 rounded-sm flex-shrink-0
                                            flex items-center justify-center 
                                            transition-all duration-150
                                            focus:outline-none focus:ring-1 focus:ring-ring
                                            ${st.completed 
                                                ? 'bg-primary border border-primary' 
                                                : 'bg-transparent border border-muted-foreground/50'
                                            }
                                        `}
                                    >
                                        {st.completed && <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />}
                                    </button>
                                    <input type="text" value={st.title} 
                                        onChange={(e) => updateTask({ subtasks: task.subtasks.map(sub => sub.id === st.id ? {...sub, title: e.target.value} : sub)})}
                                        className={`flex-grow bg-transparent text-sm ${st.completed ? 'line-through text-muted-foreground' : ''} focus:outline-none`} 
                                    />
                                </div>
                            ))}
                            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 p-2">
                                <input type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder={t('taskDetail.addSubtaskPlaceholder')} className="flex-grow bg-transparent text-sm focus:outline-none" />
                                <button type="submit" className="text-primary text-sm font-semibold">{t('taskDetail.addButton')}</button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-border">
                    <CommentSection comments={task.comments || []} onAddComment={handleAddComment} />
                </div>
             </div>
             <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
                <button onClick={handleGetGroundedInfo} disabled={isSearching || !isGeminiAvailable} className="text-sm w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-secondary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSearching ? <Spinner/> : <GlobeAltIcon className="h-5 w-5" />} {t('taskDetail.getInfoButton')}
                </button>
                 <button onClick={handleStartFocus} className="text-sm w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <PlayCircleIcon className="h-5 w-5" /> {t('taskDetail.startFocusButton')}
                </button>
            </div>
        </div>
    );
};

export default TaskDetail;
