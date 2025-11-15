'use client'

import React from 'react';
import { useToastContainer } from '../../hooks/useToast';
import { CheckCircleIcon, CloseIcon } from '../../constants'; // Assuming you have these
import { useTranslation } from '../../hooks/useI18n';

const Toast: React.FC<{ message: string; type: string; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    const { t } = useTranslation();
    // Basic icon/color mapping
    const styleMap = {
        success: { icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />, bg: 'bg-green-500' },
        error: { icon: <CloseIcon className="h-5 w-5 text-red-500" />, bg: 'bg-red-500' },
        info: { icon: <CheckCircleIcon className="h-5 w-5 text-blue-500" />, bg: 'bg-blue-500' },
    };

    return (
        <div
            className="bg-card shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden mb-4 animate-fade-in"
            role="alert"
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {styleMap[type as keyof typeof styleMap]?.icon || styleMap.info.icon}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-foreground">{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={onDismiss}
                            className="inline-flex rounded-md bg-card text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            <span className="sr-only">{t('toast.close')}</span>
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToastContainer();
    
    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-start px-4 py-6 pt-20 sm:pt-6 pointer-events-none sm:p-6 z-50"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onDismiss={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
};
