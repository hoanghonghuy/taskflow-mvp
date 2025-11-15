'use client'

import React, { createContext, useCallback, useContext, ReactNode } from 'react';
import { Toaster, toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info';

type ToastContextType = (message: string, type?: ToastType) => void;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const showToast = useCallback<ToastContextType>((message, type = 'info') => {
        switch (type) {
            case 'success':
                toast.success(message);
                break;
            case 'error':
                toast.error(message);
                break;
            default:
                toast(message);
                break;
        }
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <Toaster
                closeButton
                richColors
                expand
                position="top-right"
                toastOptions={{ duration: 4000 }}
            />
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
