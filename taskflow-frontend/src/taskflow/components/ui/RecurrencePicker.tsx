'use client'

import React from 'react';
import { Task, RecurrenceRule } from '../../types';
import { RepeatIcon } from '../../constants';
import { useTranslation } from '../../hooks/useI18n';

interface RecurrencePickerProps {
    recurrence: Task['recurrence'];
    onChange: (recurrence: Task['recurrence'] | undefined) => void;
}

const RecurrencePicker: React.FC<RecurrencePickerProps> = ({ recurrence, onChange }) => {
    const { t } = useTranslation();
    
    const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'none') {
            onChange(undefined);
        } else {
            onChange({ rule: value as RecurrenceRule });
        }
    };

    return (
        <div>
            <label className="text-sm font-medium text-muted-foreground">{t('recurrence.title')}</label>
            <div className="relative mt-1">
                <RepeatIcon className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                    value={recurrence?.rule || 'none'}
                    onChange={handleRecurrenceChange}
                    className="w-full pl-9 p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                >
                    <option value="none">{t('recurrence.none')}</option>
                    <option value="daily">{t('recurrence.daily')}</option>
                    <option value="weekly">{t('recurrence.weekly')}</option>
                    <option value="monthly">{t('recurrence.monthly')}</option>
                </select>
            </div>
        </div>
    );
};

export default RecurrencePicker;
