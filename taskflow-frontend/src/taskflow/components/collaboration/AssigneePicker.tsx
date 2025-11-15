'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../hooks/useUser';
import { User } from '../../types';
import Avatar from '../ui/Avatar';
import { UserPlusIcon, CheckCircleIcon, CloseIcon } from '../../constants';
import { useTranslation } from '../../hooks/useI18n';

interface AssigneePickerProps {
    currentAssigneeId?: string;
    onAssign: (userId: string | null) => void;
}

const AssigneePicker: React.FC<AssigneePickerProps> = ({ currentAssigneeId, onAssign }) => {
    const { allUsers } = useUser();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentAssignee = allUsers.find(u => u.id === currentAssigneeId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (userId: string | null) => {
        onAssign(userId);
        setIsOpen(false);
    };

    return (
        <div className="relative mt-1" ref={containerRef}>
            <label className="text-sm font-medium text-muted-foreground absolute -top-5">{t('assigneePicker.label')}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
                {currentAssignee ? (
                    <>
                        <Avatar user={currentAssignee} className="w-5 h-5" />
                        <span className="text-foreground">{currentAssignee.name}</span>
                    </>
                ) : (
                    <>
                        <UserPlusIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('assigneePicker.unassigned')}</span>
                    </>
                )}
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-2 w-full bg-popover text-popover-foreground rounded-md border border-border shadow-lg animate-fade-in max-h-60 overflow-y-auto">
                    <ul className="p-1">
                        <li 
                            onClick={() => handleSelect(null)}
                            className="flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-secondary"
                        >
                            {t('assigneePicker.unassign')}
                            {!currentAssigneeId && <CheckCircleIcon className="h-4 w-4 text-primary" />}
                        </li>
                        {allUsers.map(user => (
                            <li
                                key={user.id}
                                onClick={() => handleSelect(user.id)}
                                className="flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-secondary"
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar user={user} className="w-5 h-5" />
                                    <span>{user.name}</span>
                                </div>
                                {currentAssigneeId === user.id && <CheckCircleIcon className="h-4 w-4 text-primary" />}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AssigneePicker;
