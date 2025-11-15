'use client'

import React from 'react';
import { Achievement, AppState, Column, CountdownEvent, Habit, List, Priority, Task } from './types';

// Icons

export const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
    </svg>
);


export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const InboxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.12-1.588H6.88a2.25 2.25 0 00-2.12 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
);

export const CalendarDayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 15.75h.008v.008H12v-.008z" />
    </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008zm0 3h.008v.008H12v-.008zm-3-3h.008v.008H9v-.008zm0 3h.008v.008H9v-.008zm-3-3h.008v.008H6v-.008zm0 3h.008v.008H6v-.008zm6-3h.008v.008H12v-.008zm0 3h.008v.008H12v-.008zm3-3h.008v.008H15v-.008zm0 3h.008v.008H15v-.008z" />
    </svg>
);

export const ListBulletIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

export const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const FlagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.456-2.456L12.5 17.25l1.178-.398a3.375 3.375 0 002.456-2.456L16.5 13.5l.398 1.178a3.375 3.375 0 002.456 2.456l1.178.398-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

export const GlobeAltIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c.34 0 .672-.023.996-.067M12 21v-4.571M12 3a9.004 9.004 0 018.716 6.747M12 3a9.004 9.004 0 00-8.716 6.747M12 3c.34 0 .672-.023.996-.067M12 3v4.571m0 0a9.004 9.004 0 015.13 4.13M12 7.571a9.004 9.004 0 00-5.13 4.13m10.26 0a9.004 9.004 0 01-10.26 0m10.26 0c.34 0 .672-.023.996-.067" />
    </svg>
);

export const GripVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 9.75h.01M7.5 12h.01M7.5 14.25h.01M12 9.75h.01M12 12h.01M12 14.25h.01M16.5 9.75h.01M16.5 12h.01M16.5 14.25h.01" />
    </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const CubeTransparentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

export const UndoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

export const RedoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.716C7.58 2.75 6.67 3.704 6.67 4.884v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

export const ArrowsUpDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
);

export const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

export const ArrowDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

export const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.537a59.731 59.731 0 01-4.908 0l-3.722-.537C3.347 17.1 2.5 16.136 2.5 15v-4.286c0-.97.616-1.813 1.5-2.097M16.5 7.5v3.75m0 0v3.75m0-3.75h.75m-1.5 0h.75m-1.5 0h.75m2.25-3.75h.75m-1.5 0h.75m-1.5 0h.75M6.5 7.5v3.75m0 0v3.75m0-3.75h.75m-1.5 0h.75m-1.5 0h.75M9 7.5h.75m-1.5 0h.75m-1.5 0h.75" />
    </svg>
);

export const PlayCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
    </svg>
);

export const StopwatchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const BellIcon: React.FC<{ className?: string, title?: string }> = ({ className, title }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

export const RepeatIcon: React.FC<{ className?: string, title?: string }> = ({ className, title }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.182m-3.182-4.991v4.99" />
    </svg>
);

export const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
    </svg>
);

export const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25v2.25A2.25 2.25 0 018.25 21H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6A2.25 2.25 0 0115.75 3.75h2.25A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75A2.25 2.25 0 0115.75 13.5h2.25a2.25 2.25 0 012.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
    </svg>
);

export const HourglassIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.092 1.21-.138 2.43-.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7z" />
    </svg>
);

export const ViewColumnsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.26.716.53 1.003l.822.822c.272.272.67.366 1.036.218l1.282-.213c.542-.09.94.56.94 1.11v2.594c0 .55-.398 1.02-.94 1.11l-1.282.213c-.366.148-.664.564-.798.92l-.213 1.282c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.282c-.134-.356-.432-.772-.798-.92l-1.282-.213c-.542-.09-.94-.56-.94-1.11v-2.593c0 .55.398-1.02.94-1.11l1.282-.213c.366-.15.664-.565.798-.92l.213-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
export const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

export const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
);

export const ChatBubbleOvalLeftEllipsisIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.455.09-.934.09-1.425v-2.287a6.75 6.75 0 016.75-6.75h2.25l.228.008c.077.012.152.025.226.042A6.75 6.75 0 0121 12z" />
    </svg>
);


export const ArrowLeftOnRectangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

export const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.095-4.439c.43-1.033.86-2.066 1.29-3.099.43-.98.86-1.96 1.29-2.94a.75.75 0 011.33 0c.43.98.86 1.96 1.29 2.94.43 1.033.86 2.066 1.29 3.099A9.75 9.75 0 0116.5 18.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12.75h10.5M9 21h6m-6 0v-2.25m6 2.25v-2.25" />
    </svg>
);

export const HeroIllustration: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 512 341" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="26" y="24" width="288" height="200" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2"/>
        <rect x="34" y="54" width="272" height="12" rx="6" fill="hsl(var(--secondary))"/>
        <rect x="34" y="74" width="180" height="12" rx="6" fill="hsl(var(--secondary))"/>
        <rect x="34" y="104" width="36" height="36" rx="8" fill="hsl(var(--secondary))"/>
        <rect x="82" y="110" width="120" height="12" rx="6" fill="hsl(var(--primary))" fillOpacity="0.1"/>
        <rect x="82" y="128" width="60" height="8" rx="4" fill="hsl(var(--muted))"/>
        <rect x="34" y="152" width="36" height="36" rx="8" fill="hsl(var(--secondary))"/>
        <rect x="82" y="158" width="150" height="12" rx="6" fill="hsl(var(--secondary))"/>
        <rect x="82" y="176" width="80" height="8" rx="4" fill="hsl(var(--muted))"/>
        <path d="M260 118L284 118" stroke="hsl(var(--primary))" strokeWidth="10" strokeLinecap="round"/>
        <path d="M260 166L284 166" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round"/>
        <g filter="url(#filter0_d_10_2)">
            <rect x="180" y="80" width="288" height="200" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2"/>
        </g>
        <circle cx="214" cy="114" r="14" fill="hsl(var(--primary))" fillOpacity="0.1"/>
        <path d="M214 106L214 114L220 114" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="240" y="108" width="188" height="12" rx="6" fill="hsl(var(--secondary))"/>
        <rect x="196" y="150" width="272" height="12" rx="6" fill="hsl(var(--muted))"/>
        <rect x="196" y="170" width="180" height="12" rx="6" fill="hsl(var(--muted))"/>
        <rect x="196" y="190" width="220" height="12" rx="6" fill="hsl(var(--muted))"/>
        <rect x="350" y="210" width="100" height="40" rx="20" fill="hsl(var(--primary))"/>
        <path d="M386 225L400 230L386 235" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
            <filter id="filter0_d_10_2" x="160" y="62" width="328" height="240" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="2"/>
                <feGaussianBlur stdDeviation="10"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.05 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10_2"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_10_2" result="shape"/>
            </filter>
        </defs>
    </svg>
);

export const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.657-3.657-11.303-8H24v-8H42v8H43.611c.25-1.26.389-2.58.389-3.917c0-11.045-8.955-20-20-20C12.955,4,4,12.955,4,24C4,35.045,12.955,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.601,36.456,44,30.825,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

export const GitHubIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-2.915.324-2.915 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.438-3.148 1.702-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.48-.98-2.184-6.37.584-13.003 0 0 4.125-1.304 13.427 5.052a46.97 46.97 0 0112.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.804 6.633 1.064 12.023.584 13.003 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.48 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="currentColor"></path>
    </svg>
);

export const AuthIllustration: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M256 512C397.385 512 512 397.385 512 256C512 114.615 397.385 0 256 0C114.615 0 0 114.615 0 256C0 397.385 114.615 512 256 512Z" fill="hsl(var(--primary))" fillOpacity="0.1"/>
        <path d="M401 448C358.5 487 295.5 512 256 512C150.5 512 64 425.5 64 320C64 214.5 150.5 128 256 128C361.5 128 448 214.5 448 320C448 368 429 411.5 401 448Z" fill="hsl(var(--primary))" fillOpacity="0.1"/>
        <path d="M256 128C150.5 128 64 214.5 64 320C64 282 78 247 103 220.5C128 194 163.5 177.5 202.5 171C241.5 164.5 282 169 316 184C350 199 375 223.5 387.5 254.5C396.333 275.5 401.1 297.8 401 320C401 214.7 338.3 128 256 128Z" fill="hsl(var(--primary))" fillOpacity="0.1"/>
    </svg>
);


// Data Constants
export const PRIORITY_MAP: { [key in Priority]: { label: string; icon: React.FC<{ className?: string }>; color: string, checkboxBorderColor: string } } = {
    [Priority.None]: { label: 'priority.none', icon: FlagIcon, color: 'text-muted-foreground', checkboxBorderColor: 'border-muted-foreground/50' },
    [Priority.Low]: { label: 'priority.low', icon: FlagIcon, color: 'text-blue-500', checkboxBorderColor: 'border-blue-500' },
    [Priority.Medium]: { label: 'priority.medium', icon: FlagIcon, color: 'text-yellow-500', checkboxBorderColor: 'border-yellow-500' },
    [Priority.High]: { label: 'priority.high', icon: FlagIcon, color: 'text-red-500', checkboxBorderColor: 'border-red-500' },
};

export const SPECIAL_LISTS_CONFIG = {
    inbox: { id: 'inbox', name: 'specialLists.inbox', icon: <InboxIcon className="h-5 w-5" /> },
    today: { id: 'today', name: 'specialLists.today', icon: <CalendarDayIcon className="h-5 w-5" /> },
    upcoming: { id: 'upcoming', name: 'specialLists.upcoming', icon: <CalendarIcon className="h-5 w-5" /> },
};

export const TAG_COLORS = [
    'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500',
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'
];

const makeDate = (offsetDays: number) => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString();
};

const todayISO = new Date().toISOString();

export const INITIAL_LISTS: List[] = [
    { id: 'list-1', name: 'Product Roadmap', color: 'bg-blue-500', members: ['user-001', 'user-002'] },
    { id: 'list-2', name: 'Personal Errands', color: 'bg-emerald-500', members: ['user-001'] },
    { id: 'list-3', name: 'Shopping List', color: 'bg-amber-500', members: ['user-001', 'user-003'] },
];

export const INITIAL_COLUMNS: Column[] = [
    { id: 'col-list-1-1', name: 'Backlog', listId: 'list-1' },
    { id: 'col-list-1-2', name: 'In Progress', listId: 'list-1' },
    { id: 'col-list-1-3', name: 'Review', listId: 'list-1' },
    { id: 'col-list-1-4', name: 'Done', listId: 'list-1' },
    { id: 'col-list-2-1', name: 'Next Up', listId: 'list-2' },
    { id: 'col-list-2-2', name: 'Waiting', listId: 'list-2' },
    { id: 'col-list-3-1', name: 'To Buy', listId: 'list-3' },
    { id: 'col-list-3-2', name: 'Purchased', listId: 'list-3' },
];

export const INITIAL_TASKS: Task[] = [
    {
        id: 'task-1',
        title: 'Finalize quarterly roadmap narrative',
        description: 'Synthesize PM feedback and highlight the three flagship initiatives for Q4.',
        completed: false,
        dueDate: makeDate(1),
        priority: Priority.High,
        listId: 'list-1',
        columnId: 'col-list-1-2',
        tags: ['roadmap', 'executive'],
        subtasks: [
            { id: 'task-1-sub-1', title: 'Collect PM summaries', completed: true },
            { id: 'task-1-sub-2', title: 'Draft narrative outline', completed: false }
        ],
        createdAt: todayISO,
        totalFocusTime: 5400,
        assigneeId: 'user-002',
        comments: [
            {
                id: 'task-1-comment-1',
                userId: 'user-002',
                content: 'Outline looks good, adding finance updates tomorrow.',
                createdAt: makeDate(-1),
            }
        ],
    },
    {
        id: 'task-2',
        title: 'Design review: mobile checklist experience',
        description: 'Review Figma prototype with design guild and prepare implementation notes.',
        completed: false,
        dueDate: makeDate(3),
        priority: Priority.Medium,
        listId: 'list-1',
        columnId: 'col-list-1-1',
        tags: ['design', 'mobile'],
        subtasks: [
            { id: 'task-2-sub-1', title: 'Leave feedback on Figma', completed: false },
        ],
        createdAt: makeDate(-2),
        totalFocusTime: 1800,
        assigneeId: 'user-001',
    },
    {
        id: 'task-3',
        title: 'Create sprint demo deck',
        description: 'Collect screenshots and prepare narrative for Friday demo.',
        completed: false,
        dueDate: makeDate(2),
        priority: Priority.High,
        listId: 'list-1',
        columnId: 'col-list-1-3',
        tags: ['presentation'],
        subtasks: [],
        createdAt: makeDate(-3),
        totalFocusTime: 2700,
    },
    {
        id: 'task-4',
        title: 'Inbox zero sweep',
        description: 'Process remaining action items from team feedback.',
        completed: false,
        dueDate: makeDate(0),
        priority: Priority.Low,
        listId: 'inbox',
        tags: ['admin'],
        subtasks: [],
        createdAt: todayISO,
        totalFocusTime: 900,
    },
    {
        id: 'task-5',
        title: 'Schedule annual physical',
        description: '',
        completed: false,
        dueDate: makeDate(10),
        priority: Priority.Medium,
        listId: 'list-2',
        columnId: 'col-list-2-1',
        tags: ['health'],
        subtasks: [],
        createdAt: todayISO,
        totalFocusTime: 0,
    },
    {
        id: 'task-6',
        title: 'Weekend meal prep',
        description: 'Plan simple meals and prep grocery list.',
        completed: true,
        completedAt: makeDate(-1),
        dueDate: makeDate(-1),
        priority: Priority.Low,
        listId: 'list-2',
        columnId: 'col-list-2-2',
        tags: ['wellness'],
        subtasks: [
            { id: 'task-6-sub-1', title: 'Prep grains', completed: true },
            { id: 'task-6-sub-2', title: 'Chop vegetables', completed: true },
        ],
        createdAt: makeDate(-5),
        totalFocusTime: 1200,
    },
    {
        id: 'task-7',
        title: 'Restock coffee beans',
        description: 'Order the seasonal roast from the local roaster.',
        completed: false,
        dueDate: makeDate(4),
        priority: Priority.None,
        listId: 'list-3',
        columnId: 'col-list-3-1',
        tags: ['shopping'],
        subtasks: [],
        createdAt: makeDate(-4),
        totalFocusTime: 0,
        assigneeId: 'user-003',
    },
    {
        id: 'task-8',
        title: 'Renew gym membership',
        description: 'Membership expires at the end of the month.',
        completed: false,
        dueDate: makeDate(12),
        priority: Priority.Medium,
        listId: 'list-2',
        columnId: 'col-list-2-1',
        tags: ['health'],
        subtasks: [],
        createdAt: makeDate(-6),
        totalFocusTime: 0,
    },
    {
        id: 'task-9',
        title: 'Plan winter team offsite',
        description: 'Draft agenda and shortlist potential venues.',
        completed: false,
        dueDate: makeDate(20),
        priority: Priority.Medium,
        listId: 'list-1',
        columnId: 'col-list-1-1',
        tags: ['team', 'planning'],
        subtasks: [
            { id: 'task-9-sub-1', title: 'Collect venue quotes', completed: false },
            { id: 'task-9-sub-2', title: 'Draft agenda outline', completed: true },
        ],
        createdAt: makeDate(-7),
        totalFocusTime: 3600,
        assigneeId: 'user-001',
    },
    {
        id: 'task-10',
        title: 'Daily standup sync',
        description: 'Quick asynchronous update for the engineering pod.',
        completed: false,
        dueDate: makeDate(0),
        priority: Priority.Medium,
        listId: 'list-1',
        columnId: 'col-list-1-2',
        tags: ['ritual'],
        subtasks: [],
        createdAt: todayISO,
        totalFocusTime: 0,
        recurrence: { rule: 'daily' },
    },
];

const deriveInitialTags = () => {
    const tags = new Set<string>();
    INITIAL_TASKS.forEach(task => task.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
};

export const INITIAL_TAGS = deriveInitialTags();

export const INITIAL_HABITS: Habit[] = [
    {
        id: 'habit-1',
        name: 'Morning journaling',
        completions: [makeDate(-2).split('T')[0], makeDate(-1).split('T')[0]],
        createdAt: makeDate(-14),
    },
    {
        id: 'habit-2',
        name: 'Drink 2L of water',
        completions: [makeDate(-3).split('T')[0], makeDate(-1).split('T')[0]],
        createdAt: makeDate(-30),
    },
];

export const INITIAL_COUNTDOWNS: CountdownEvent[] = [
    {
        id: 'countdown-1',
        name: 'Product launch day',
        targetDate: makeDate(45),
    },
];

export const POMODORO_SETTINGS = {
    pomoDuration: 25 * 60, // 25 minutes
    shortBreakDuration: 5 * 60, // 5 minutes
    longBreakDuration: 15 * 60, // 15 minutes
    longBreakInterval: 4, // 4 pomodoros
};

const EmptyStateIllustration: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 90 C 20 80, 40 80, 50 90 L 90 90 C 100 80, 120 80, 130 90" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="transparent" strokeDasharray="5 5" />
      <path d="M 30 70 L 30 50 C 30 30, 70 30, 70 50 L 70 70" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="transparent" />
      <circle cx="50" cy="20" r="5" fill="hsl(var(--primary))" opacity="0.5" />
      <path d="M 80 70 L 120 70" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="transparent" />
      <path d="M 80 60 L 120 60" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="transparent" />
    </svg>
);

export const EMPTY_STATE_ILLUSTRATIONS = {
    noTasks: <EmptyStateIllustration className="w-48 h-32 text-muted-foreground/50 mb-4" />
}

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

const calculateStreak = (completions: string[]): number => {
    if (completions.length === 0) return 0;
    const sortedDates = completions.map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
    let streak = 0;
    const today = new Date();
    const latestCompletion = sortedDates[0];
    const todayStr = toYYYYMMDD(today);
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = toYYYYMMDD(yesterday);
    const latestCompletionStr = toYYYYMMDD(latestCompletion);

    if (latestCompletionStr === todayStr || latestCompletionStr === yesterdayStr) {
        streak = 1;
        let currentStreakDate = latestCompletion;
        for (let i = 1; i < sortedDates.length; i++) {
            const nextExpectedDate = new Date(currentStreakDate);
            nextExpectedDate.setDate(nextExpectedDate.getDate() - 1);
            if (toYYYYMMDD(sortedDates[i]) === toYYYYMMDD(nextExpectedDate)) {
                streak++;
                currentStreakDate = sortedDates[i];
            } else if (toYYYYMMDD(sortedDates[i]) !== toYYYYMMDD(currentStreakDate)) {
                break;
            }
        }
    }
    return streak;
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
    { id: 'first_step', title: 'achievements.first_step.title', description: 'achievements.first_step.description', icon: CheckCircleIcon, condition: (state) => state.tasks.some(t => t.completed) },
    { id: 'task_novice', title: 'achievements.task_novice.title', description: 'achievements.task_novice.description', icon: CheckCircleIcon, condition: (state) => state.tasks.filter(t => t.completed).length >= 10 },
    { id: 'task_master', title: 'achievements.task_master.title', description: 'achievements.task_master.description', icon: CheckCircleIcon, condition: (state) => state.tasks.filter(t => t.completed).length >= 100 },
    { id: 'focus_starter', title: 'achievements.focus_starter.title', description: 'achievements.focus_starter.description', icon: StopwatchIcon, condition: (state) => state.pomodoro.focusHistory.length >= 1 },
    { id: 'focus_pro', title: 'achievements.focus_pro.title', description: 'achievements.focus_pro.description', icon: StopwatchIcon, condition: (state) => state.pomodoro.focusHistory.length >= 25 },
    { id: 'habit_builder', title: 'achievements.habit_builder.title', description: 'achievements.habit_builder.description', icon: RepeatIcon, condition: (state) => state.habits.some(h => calculateStreak(h.completions) >= 7) },
    { id: 'habit_hero', title: 'achievements.habit_hero.title', description: 'achievements.habit_hero.description', icon: RepeatIcon, condition: (state) => state.habits.some(h => calculateStreak(h.completions) >= 30) },
    { id: 'ai_assistant', title: 'achievements.ai_assistant.title', description: 'achievements.ai_assistant.description', icon: SparklesIcon, condition: (state) => state.tasks.some(t => t.subtasks.some(st => st.id.startsWith('gen-'))) },
    { id: 'planner', title: 'achievements.planner.title', description: 'achievements.planner.description', icon: CalendarIcon, condition: (state) => state.tasks.filter(t => t.dueDate).length >= 10 },
    { id: 'delegator', title: 'achievements.delegator.title', description: 'achievements.delegator.description', icon: UserPlusIcon, condition: (state) => state.tasks.filter(t => t.assigneeId).length >= 5 },
];
