'use client'

import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { GlobeAltIcon } from '../../constants';

interface LanguageSwitcherProps {
    className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
    const { language, setLanguage } = useSettings();

    return (
        <div className={`relative ${className}`}>
            <GlobeAltIcon className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
                className="pl-10 pr-4 py-2 bg-secondary/50 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                aria-label="Select language"
            >
                <option value="en">EN</option>
                <option value="vi">VI</option>
            </select>
        </div>
    );
};

export default LanguageSwitcher;
