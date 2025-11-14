'use client'

import React, { useState, useMemo } from 'react';
import TaskList from '../task/TaskList';
import { useTaskManager } from '../../hooks/useTaskManager';
import { SPECIAL_LISTS_CONFIG, PlusIcon, UndoIcon, RedoIcon, TrashIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon, SearchIcon, SparklesIcon } from '../../constants';
import { SortOrder } from '../../types';
import { useTranslation } from '../../hooks/useI18n';
import { useUser } from '../../hooks/useUser';
import Avatar from '../ui/Avatar';


interface MainContentProps {
    onSearchToggle: () => void;
    onBriefingToggle: () => void;
    onOpenTaskForm: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onSearchToggle, onBriefingToggle, onOpenTaskForm }) => {
    const { state, dispatch, canUndo, canRedo } = useTaskManager();
    const { allUsers } = useUser();
    const { t } = useTranslation();

    const activeList = useMemo(() => {
        if (state.activeListId in SPECIAL_LISTS_CONFIG || state.activeTag) {
            return null;
        }
        return state.lists.find(l => l.id === state.activeListId);
    }, [state.activeListId, state.lists, state.activeTag]);

    const listMembers = useMemo(() => {
        if (!activeList || !activeList.members) return [];
        return activeList.members.map(memberId => allUsers.find(u => u.id === memberId)).filter(Boolean);
    }, [activeList, allUsers]);

    const getActiveListName = () => {
        if (state.activeTag) {
            return `#${state.activeTag}`;
        }
        if (state.activeListId in SPECIAL_LISTS_CONFIG) {
            const configKey = state.activeListId as keyof typeof SPECIAL_LISTS_CONFIG;
            return t(SPECIAL_LISTS_CONFIG[configKey].name);
        }
        return activeList ? activeList.name : t('mainContent.tasksDefault');
    };

    const handleUndo = () => {
        if (canUndo) {
            dispatch({ type: 'UNDO' });
        }
    };

    const handleRedo = () => {
        if (canRedo) {
            dispatch({ type: 'REDO' });
        }
    };

    const handleClearHistory = () => {
        if (canUndo || canRedo) {
            dispatch({ type: 'CLEAR_HISTORY' });
        }
    };
    
    const handleSortToggle = () => {
        let nextSortOrder: SortOrder;
        if (state.sortOrder === 'default') {
            nextSortOrder = 'dueDateAsc';
        } else if (state.sortOrder === 'dueDateAsc') {
            nextSortOrder = 'dueDateDesc';
        } else {
            nextSortOrder = 'default';
        }
        dispatch({ type: 'SET_SORT_ORDER', payload: nextSortOrder });
    };

    const SortIcon = () => {
        if (state.sortOrder === 'dueDateAsc') return <ArrowUpIcon className="h-5 w-5 text-muted-foreground" />;
        if (state.sortOrder === 'dueDateDesc') return <ArrowDownIcon className="h-5 w-5 text-muted-foreground" />;
        return <ArrowsUpDownIcon className="h-5 w-5 text-muted-foreground" />;
    };

    return (
        <main className="flex-1 flex flex-col">
            <header className="flex-shrink-0 grid grid-cols-2 md:grid-cols-3 items-center p-4 md:p-6 border-b border-border gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl md:text-2xl font-bold truncate">{getActiveListName()}</h1>
                    {listMembers.length > 0 && (
                        <div className="flex items-center -space-x-2">
                            {listMembers.slice(0, 3).map(member => (
                                member && <Avatar key={member.id} user={member} className="w-7 h-7 border-2 border-background" />
                            ))}
                            {listMembers.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold border-2 border-background">
                                    +{listMembers.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center md:col-start-2">
                     <button
                        onClick={onBriefingToggle}
                        className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md cursor-pointer hover:bg-muted"
                        role="button"
                        tabIndex={0}
                        aria-label="Get AI Daily Briefing"
                    >
                        <SparklesIcon className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground hidden sm:inline">{t('mainContent.dailyBriefing')}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 justify-end col-start-2 md:col-start-3">
                    <button
                        onClick={onSearchToggle}
                        className="p-2 rounded-md hover:bg-secondary"
                        aria-label={t('mainContent.searchTasks')}
                    >
                         <SearchIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <button
                        onClick={handleSortToggle}
                        className="p-2 rounded-md hover:bg-secondary"
                        aria-label={t('mainContent.sortTasks')}
                    >
                        <SortIcon />
                    </button>
                    <div className="hidden md:flex items-center gap-2">
                        <button 
                            onClick={handleUndo} 
                            disabled={!canUndo} 
                            className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            aria-label={t('mainContent.undo')}
                        >
                            <UndoIcon className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <button 
                            onClick={handleRedo} 
                            disabled={!canRedo} 
                            className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            aria-label={t('mainContent.redo')}
                        >
                            <RedoIcon className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <button
                            onClick={handleClearHistory}
                            disabled={!canUndo && !canRedo}
                            className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            aria-label={t('mainContent.clearHistory')}
                        >
                            <TrashIcon className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
                <TaskList onAddTask={onOpenTaskForm} />
            </div>

            <button
                onClick={() => onOpenTaskForm()}
                className="absolute bottom-20 md:bottom-8 right-4 md:right-8 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-105"
                aria-label={t('taskList.addTask')}
            >
                <PlusIcon className="h-6 w-6" />
            </button>
        </main>
    );
};

export default MainContent;
