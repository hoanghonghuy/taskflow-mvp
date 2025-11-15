'use client'

import React from 'react';
import { useConfirmation, ConfirmationOptions } from '../../hooks/useConfirmation';
import { CloseIcon, TrashIcon } from '../../constants';
import { useTranslation } from '../../hooks/useI18n';

const ConfirmationModal: React.FC = () => {
    const { options, proceed, cancel } = useConfirmation();
    const { t } = useTranslation();

    if (!options) {
        return null;
    }

    const {
        title,
        message,
        confirmText = t('taskForm.createTask'), // A generic confirm, might need adjustment
        cancelText = t('board.column.cancel'),
        isDestructive = true,
    } = options;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={cancel}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-card rounded-lg shadow-xl w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={cancel} className="p-1 rounded-full hover:bg-secondary">
                        <CloseIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                </header>
                
                <div className="p-6">
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>

                <footer className="p-4 bg-secondary rounded-b-lg flex justify-end gap-4">
                    <button 
                        onClick={cancel} 
                        className="px-4 py-2 bg-background border border-border rounded-md text-sm font-semibold hover:bg-muted"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={proceed} 
                        className={`px-4 py-2 rounded-md text-sm font-semibold ${
                            isDestructive 
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                    >
                        {confirmText}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ConfirmationModal;
