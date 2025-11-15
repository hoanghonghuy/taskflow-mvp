'use client'

import React, { useState, useRef, useEffect } from 'react';
import { CalendarDayIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../../constants';
import { useTranslation } from '../../hooks/useI18n';
import { useSettings } from '../../hooks/useSettings';

interface DatePickerProps {
    value?: string; // ISO string
    onChange: (date: Date | null) => void;
}

// Helper functions to replace date-fns
const addMonths = (date: Date, amount: number): Date => {
    const newDate = new Date(date);
    const d = newDate.getDate();
    newDate.setMonth(newDate.getMonth() + amount);
    // If the new month has fewer days, the month could change.
    // This check corrects for it.
    if (newDate.getDate() !== d) {
        newDate.setDate(0);
    }
    return newDate;
};

const addDays = (date: Date, amount: number): Date => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + amount);
    return newDate;
};

const isSameMonth = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const isToday = (date: Date): boolean => {
    const today = new Date();
    return isSameDay(date, today);
};

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();
    const { language } = useSettings();
    const selectedDate = value ? new Date(value) : null;
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        // If the value prop changes, update the calendar's month
        if (selectedDate) {
            setCurrentMonth(new Date(selectedDate));
        }
    }, [value]);

    const handleDateSelect = (day: Date) => {
        onChange(day);
        setIsOpen(false);
    };
    
    const handleClearDate = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setIsOpen(false);
    }

    const renderHeader = () => (
        <div className="flex items-center justify-between py-2 px-3">
            <span className="text-sm font-semibold">{currentMonth.toLocaleDateString(language, { month: 'long', year: 'numeric' })}</span>
            <div className="flex items-center space-x-1">
                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-1 rounded-md hover:bg-secondary">
                    <ChevronLeftIcon className="h-4 w-4 text-muted-foreground" />
                </button>
                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-md hover:bg-secondary">
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
        </div>
    );

    const renderDays = () => {
        const dayNames = Array.from({ length: 7 }, (_, i) => {
            // A known Sunday is Jan 7, 2024
            const day = new Date(2024, 0, 7 + i);
            return day.toLocaleDateString(language, { weekday: 'short' });
        });
        return (
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
                {dayNames.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Adjust start date to Sunday for the grid
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        
        // Adjust end date to Saturday for the grid
        const endDate = new Date(monthEnd);
        if (endDate.getDay() !== 6) {
             endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
        }

        const rows = [];
        let days = [];
        let day = new Date(startDate);

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = new Date(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isCurrentDay = isToday(day);

                days.push(
                    <div className="p-1 flex justify-center" key={day.toString()}>
                        <button
                            type="button"
                            onClick={() => handleDateSelect(cloneDay)}
                            className={`
                                w-8 h-8 rounded-md text-sm transition-colors
                                ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                                ${isCurrentDay && !isSelected ? 'ring-1 ring-primary' : ''}
                                ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-secondary'}
                            `}
                        >
                            {cloneDay.getDate()}
                        </button>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="p-2">{rows}</div>;
    };


    return (
        <div className="relative mt-1" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
                <span className={selectedDate ? 'text-foreground' : 'text-muted-foreground'}>
                    {selectedDate ? selectedDate.toLocaleDateString(language, { month: 'long', day: 'numeric', year: 'numeric' }) : t('datePicker.placeholder')}
                </span>
                 <div className="flex items-center">
                    {selectedDate && (
                         <button
                            type="button"
                            onClick={handleClearDate}
                            className="mr-2 p-1 rounded-full hover:bg-muted"
                            aria-label={t('datePicker.aria.clear')}
                        >
                            <CloseIcon className="h-3 w-3" />
                        </button>
                    )}
                    <CalendarDayIcon className="h-4 w-4 text-muted-foreground" />
                </div>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-2 w-full bg-popover text-popover-foreground rounded-md border border-border shadow-lg animate-fade-in">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                     <div className="p-2 border-t border-border flex justify-end gap-2">
                        <button type="button" onClick={() => { handleDateSelect(new Date()); }} className="text-xs px-2 py-1 rounded-md hover:bg-secondary">{t('datePicker.today')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
