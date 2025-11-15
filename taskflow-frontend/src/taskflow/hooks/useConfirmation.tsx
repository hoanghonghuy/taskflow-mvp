'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useRef } from 'react';

export interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

interface ConfirmationContextType {
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
    options: ConfirmationOptions | null;
    proceed: () => void;
    cancel: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [options, setOptions] = useState<ConfirmationOptions | null>(null);
    const resolvePromiseRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setOptions(options);
            resolvePromiseRef.current = resolve;
        });
    }, []);

    const handleConfirm = useCallback((value: boolean) => {
        if (resolvePromiseRef.current) {
            resolvePromiseRef.current(value);
        }
        setOptions(null);
        resolvePromiseRef.current = null;
    }, []);

    const cancel = useCallback(() => {
        handleConfirm(false);
    }, [handleConfirm]);

    const proceed = useCallback(() => {
        handleConfirm(true);
    }, [handleConfirm]);

    const value = useMemo(() => ({
        confirm,
        options,
        proceed,
        cancel
    }), [confirm, options, proceed, cancel]);

    return (
        <ConfirmationContext.Provider value={value}>
            {children}
        </ConfirmationContext.Provider>
    );
};

export const useConfirmation = () => {
    const context = useContext(ConfirmationContext);
    if (context === undefined) {
        throw new Error('useConfirmation must be used within a ConfirmationProvider');
    }
    return context;
};
