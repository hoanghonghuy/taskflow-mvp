'use client'

import React from 'react';
import { BellIcon } from '../../constants';
import { useTranslation } from '../../hooks/useI18n';

interface ReminderSetterProps {
    reminder: number | undefined;
    onChange: (minutes: number | undefined) => void;
}

const ReminderSetter: React.FC<ReminderSetterProps> = ({ reminder, onChange }) => {
    const { t } = useTranslation();

    const REMINDER_OPTIONS = [
        { label: t('reminder.none'), value: 'none' },
        { label: t('reminder.5min'), value: '5' },
        { label: t('reminder.15min'), value: '15' },
        { label: t('reminder.30min'), value: '30' },
        { label: t('reminder.1hour'), value: '60' },
    ];

    const handleReminderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'none') {
            onChange(undefined);
        } else {
            onChange(parseInt(value, 10));
        }
    };

    return (
        <div>
            <label className="text-sm font-medium text-muted-foreground">{t('reminder.title')}</label>
            <div className="relative mt-1">
                <BellIcon className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                    value={reminder || 'none'}
                    onChange={handleReminderChange}
                    className="w-full pl-9 p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                >
                    {REMINDER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ReminderSetter;
