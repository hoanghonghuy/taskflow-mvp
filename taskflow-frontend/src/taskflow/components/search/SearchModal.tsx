'use client'

import React, { useState, useMemo } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Task } from '../../types';
import { CloseIcon, SearchIcon } from '../../constants';
import TaskItem from '../task/TaskItem';
import { useTranslation } from '../../hooks/useI18n';

interface SearchModalProps {
    onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
    const { state, dispatch } = useTaskManager();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) {
            return [];
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return state.tasks.filter(task => 
            task.title.toLowerCase().includes(lowercasedTerm) ||
            task.description?.toLowerCase().includes(lowercasedTerm) ||
            task.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))
        );
    }, [searchTerm, state.tasks]);

    // Override TaskItem click to close modal and select task
    const handleTaskSelect = (task: Task) => {
        dispatch({ type: 'SET_SELECTED_TASK', payload: task.id });
        if (task.listId) {
             dispatch({ type: 'SET_ACTIVE_LIST', payload: task.listId });
        }
        onClose();
    };

    const getListName = (listId: string): string => {
        if (listId === 'inbox') {
            return t('specialLists.inbox');
        }
        const list = state.lists.find(l => l.id === listId);
        return list ? list.name : '';
    };

    return (
        <div className="fixed inset-0 bg-background/90 z-40 flex justify-center p-4 sm:p-6 md:p-12 animate-fade-in" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex items-center border-b border-border">
                    <SearchIcon className="h-5 w-5 text-muted-foreground mr-3" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={t('search.placeholder')}
                        className="w-full bg-transparent text-lg focus:outline-none"
                        autoFocus
                    />
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary ml-4">
                        <CloseIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                </header>
                
                <div className="flex-grow p-4 overflow-y-auto">
                    {searchTerm.trim() && searchResults.length === 0 && (
                         <div className="text-center py-12 text-muted-foreground">
                            <p>{t('search.noResults', { searchTerm })}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        {searchResults.map(task => (
                            <div key={task.id} onClick={() => handleTaskSelect(task)}>
                                <TaskItem 
                                    task={task} 
                                    isDraggable={false} 
                                    listName={getListName(task.listId)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
