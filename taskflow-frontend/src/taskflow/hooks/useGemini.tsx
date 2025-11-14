'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

interface GeminiClient {
    readonly isMock: boolean;
}

interface GeminiContextType {
    ai: GeminiClient | null;
    isAvailable: boolean;
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

export const GeminiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [ai, setAi] = useState<GeminiClient | null>(null);
    const isAvailable = useMemo(() => !!ai, [ai]);

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? process.env.API_KEY;
        if (!apiKey) {
            setAi(null);
            return;
        }

        setAi({ isMock: true });
    }, []);
    
    const contextValue = {
        ai,
        isAvailable,
    };

    return (
        <GeminiContext.Provider value={contextValue}>
            {children}
        </GeminiContext.Provider>
    );
};

export const useGemini = (): GeminiContextType => {
    const context = useContext(GeminiContext);
    if (context === undefined) {
        throw new Error('useGemini must be used within a GeminiProvider');
    }
    return context;
};
