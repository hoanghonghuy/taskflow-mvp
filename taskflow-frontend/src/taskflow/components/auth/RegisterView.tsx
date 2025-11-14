'use client'

import React, { useState } from 'react';
import { useUser } from '../../hooks/useUser';
import { useTranslation } from '../../hooks/useI18n';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { AuthIllustration, GoogleIcon, GitHubIcon } from '../../constants';

interface RegisterViewProps {
    onSwitchToLogin: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin }) => {
    const { register } = useUser();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // For the mock, any input will "register" and log in the user
        register(name, email, password);
    };
    
    const handleSocialLogin = () => {
        // Mock social login
        register('Social User', 'social@example.com', 'password');
    }

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
            {/* Left Column (Branding) */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-secondary p-12 text-center">
                <AuthIllustration className="w-full max-w-md" />
                 <h2 className="text-3xl font-bold mt-8">TaskFlow</h2>
                 <p className="text-muted-foreground mt-2 max-w-sm">
                    {t('auth.tagline')}
                </p>
            </div>

            {/* Right Column (Form) */}
            <div className="flex items-center justify-center p-6 sm:p-8 relative">
                 <LanguageSwitcher className="absolute top-6 right-6" />
                 <div className="w-full max-w-sm space-y-6">
                     <div className="text-center lg:hidden">
                        <div className="flex justify-center items-center gap-2 mb-2">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-primary">
                                <rect width="256" height="256" fill="none"></rect>
                                <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm45.15,122.34-8.6-14.9a4,4,0,0,0-6.92,0l-22.1,38.28a4,4,0,0,1-3.46,2H92a4,4,0,0,1-3.46-6l25.56-44.28a4,4,0,0,0-3.46-6H65.75a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,6l-25.56,44.28a4,4,0,0,0,3.46,6h22.54a4,4,0,0,1,3.46-2l22.1-38.28a4,4,0,0,0-3.46-6H134.25a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,2l8.6,14.9a4,4,0,0,1-3.46,6H173.15a4,4,0,0,1,0,8h-3.46a4,4,0,0,1-3.46-2Z"></path>
                            </svg>
                            <h1 className="text-3xl font-bold">TaskFlow</h1>
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">{t('auth.createAccountPrompt')}</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleSocialLogin} className="w-full inline-flex items-center justify-center py-2 px-4 border border-border rounded-md shadow-sm bg-card hover:bg-secondary text-sm font-medium">
                            <GoogleIcon className="w-5 h-5 mr-2" />
                            {t('auth.signInWithGoogle')}
                        </button>
                        <button onClick={handleSocialLogin} className="w-full inline-flex items-center justify-center py-2 px-4 border border-border rounded-md shadow-sm bg-card hover:bg-secondary text-sm font-medium">
                            <GitHubIcon className="w-5 h-5 mr-2" />
                            {t('auth.signInWithGitHub')}
                        </button>
                    </div>

                     <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-background px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-muted-foreground sr-only">
                                {t('auth.fullNameLabel')}
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('auth.fullNameLabel')}
                                className="w-full p-3 bg-secondary/80 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-muted-foreground sr-only">
                                {t('auth.emailLabel')}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('auth.emailLabel')}
                                className="w-full p-3 bg-secondary/80 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="text-sm font-medium text-muted-foreground sr-only">
                                {t('auth.passwordLabel')}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('auth.passwordLabel')}
                                className="w-full p-3 bg-secondary/80 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="w-full px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary"
                            >
                                {t('auth.signUp')}
                            </button>
                        </div>
                    </form>
                     <p className="text-center text-sm text-muted-foreground">
                        {t('auth.alreadyHaveAccount')}{' '}
                        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-primary hover:underline">
                            {t('auth.signIn')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterView;
