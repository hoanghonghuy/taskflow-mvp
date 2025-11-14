'use client'

import React, { useState } from 'react';
import { User } from '../../types';
import { useTranslation } from '../../hooks/useI18n';
import { CloseIcon } from '../../constants';

interface EditProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: (updatedData: Partial<User>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('profile.editModal.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
                        <CloseIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                </header>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                                {t('profile.editModal.nameLabel')}
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 w-full p-2 bg-secondary/80 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                                {t('profile.editModal.emailLabel')}
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full p-2 bg-secondary/80 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>
                    </div>
                    <footer className="p-4 bg-secondary/50 rounded-b-lg flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-background border border-border rounded-md text-sm font-semibold hover:bg-muted"
                        >
                            {t('board.column.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90"
                        >
                            {t('profile.editModal.saveButton')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
