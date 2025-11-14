'use client'

import React, { useState } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { CountdownEvent } from '../../types';
import { PlusIcon, TrashIcon, CloseIcon } from '../../constants';
import { useConfirmation } from '../../hooks/useConfirmation';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from '../../hooks/useI18n';

const AddCountdownModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { dispatch } = useTaskManager();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [targetDate, setTargetDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && targetDate) {
            const newEvent: CountdownEvent = {
                id: Date.now().toString(),
                name: name.trim(),
                targetDate: new Date(targetDate).toISOString(),
            };
            dispatch({ type: 'ADD_COUNTDOWN', payload: newEvent });
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
                 <header className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('countdown.modal.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
                        <CloseIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                </header>
                 <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('countdown.modal.nameLabel')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t('countdown.modal.namePlaceholder')}
                            className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('countdown.modal.dateLabel')}</label>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={e => setTargetDate(e.target.value)}
                            className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                    </div>
                     <footer className="pt-2 flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90">
                            {t('countdown.modal.create')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const CountdownCard: React.FC<{ event: CountdownEvent }> = ({ event }) => {
    const { dispatch } = useTaskManager();
    const { t } = useTranslation();
    const { confirm } = useConfirmation();
    const addToast = useToast();
    const target = new Date(event.targetDate);
    const now = new Date();
    
    // Set time to 0 to count full days
    target.setHours(0,0,0,0);
    now.setHours(0,0,0,0);

    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const handleDelete = async () => {
        const isConfirmed = await confirm({
            title: t('countdown.deleteConfirm.title', { eventName: event.name }),
            message: t('countdown.deleteConfirm.message'),
            confirmText: t('countdown.deleteConfirm.confirmText'),
        });
        if(isConfirmed) {
            dispatch({ type: 'DELETE_COUNTDOWN', payload: event.id });
            addToast(t('countdown.deleteSuccess', { eventName: event.name }), 'success');
        }
    }

    return (
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between relative group">
            <div>
                <h3 className="text-lg font-bold">{event.name}</h3>
                <p className="text-sm text-muted-foreground">
                    {new Date(event.targetDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            <div className="text-right mt-4">
                {diffDays < 0 ? (
                    <p className="text-4xl font-bold text-muted-foreground">{t('countdown.card.expired')}</p>
                ) : (
                    <>
                        <p className="text-6xl font-bold text-primary">{diffDays}</p>
                        <p className="text-muted-foreground">{diffDays === 1 ? t('countdown.card.dayRemaining') : t('countdown.card.daysRemaining')}</p>
                    </>
                )}
            </div>
             <button onClick={handleDelete} className="absolute top-2 right-2 p-1.5 rounded-full bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon className="h-4 w-4"/>
            </button>
        </div>
    );
};

const CountdownView: React.FC = () => {
    const { state } = useTaskManager();
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="p-6 border-b border-border flex-shrink-0 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('countdownView.title')}</h1>
                    <p className="text-muted-foreground">{t('countdownView.subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90"
                >
                    <PlusIcon className="h-5 w-5" />
                    {t('countdownView.add')}
                </button>
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
                {state.countdownEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.countdownEvents.map(event => (
                            <CountdownCard key={event.id} event={event} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-muted-foreground">
                        <h2 className="text-xl font-semibold">{t('countdownView.emptyState.title')}</h2>
                        <p>{t('countdownView.emptyState.subtitle')}</p>
                    </div>
                )}
            </main>
            {isModalOpen && <AddCountdownModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default CountdownView;
