'use client'

import React from 'react';
import { SparklesIcon, GridIcon, ArchiveBoxIcon, HeroIllustration } from '../../constants';
import Avatar from '../ui/Avatar';
import { useTranslation } from '../../hooks/useI18n';
import LanguageSwitcher from '../ui/LanguageSwitcher';

interface LandingPageProps {
    onLaunch: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-background text-foreground min-h-screen">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-primary">
                            <rect width="256" height="256" fill="none"></rect>
                            <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm45.15,122.34-8.6-14.9a4,4,0,0,0-6.92,0l-22.1,38.28a4,4,0,0,1-3.46,2H92a4,4,0,0,1-3.46-6l25.56-44.28a4,4,0,0,0-3.46-6H65.75a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,6l-25.56,44.28a4,4,0,0,0,3.46,6h22.54a4,4,0,0,1,3.46-2l22.1-38.28a4,4,0,0,0-3.46-6H134.25a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,2l8.6,14.9a4,4,0,0,1-3.46,6H173.15a4,4,0,0,1,0,8h-3.46a4,4,0,0,1-3.46-2Z"></path>
                        </svg>
                        <h1 className="text-xl font-bold">TaskFlow</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <button 
                            onClick={onLaunch}
                            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            {t('landing.nav.launch')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6">
                {/* Hero Section */}
                <section className="text-center py-20">
                    <h2 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
                        {t('landing.hero.title')}
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                        {t('landing.hero.subtitle')}
                    </p>
                    <button 
                        onClick={onLaunch}
                        className="px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-bold hover:bg-primary/90 transition-transform hover:scale-105"
                    >
                        {t('landing.hero.cta')}
                    </button>
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10"></div>
                        <HeroIllustration className="w-full max-w-3xl mx-auto mt-16" />
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20">
                    <div className="text-center mb-12">
                         <h3 className="text-3xl md:text-4xl font-bold">{t('landing.features.title')}</h3>
                         <p className="text-muted-foreground mt-2">{t('landing.features.subtitle')}</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all">
                            <div className="p-3 inline-block bg-primary/10 rounded-lg mb-4">
                                <SparklesIcon className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('landing.feature1.title')}</h3>
                            <p className="text-muted-foreground">
                                {t('landing.feature1.description')}
                            </p>
                        </div>
                        <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all">
                            <div className="p-3 inline-block bg-primary/10 rounded-lg mb-4">
                                <GridIcon className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('landing.feature2.title')}</h3>
                            <p className="text-muted-foreground">
                                {t('landing.feature2.description')}
                            </p>
                        </div>
                        <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all">
                             <div className="p-3 inline-block bg-primary/10 rounded-lg mb-4">
                                <ArchiveBoxIcon className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('landing.feature3.title')}</h3>
                            <p className="text-muted-foreground">
                                {t('landing.feature3.description')}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20">
                     <div className="text-center mb-12">
                         <h3 className="text-3xl md:text-4xl font-bold">{t('landing.testimonials.title')}</h3>
                         <p className="text-muted-foreground mt-2">{t('landing.testimonials.subtitle')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <p className="text-muted-foreground mb-4">{t('landing.testimonial1.quote')}</p>
                            <div className="flex items-center gap-3">
                                <Avatar user={{id: 't1', name: t('landing.testimonial1.author'), email: ''}} className="w-10 h-10"/>
                                <div>
                                    <p className="font-semibold">{t('landing.testimonial1.author')}</p>
                                    <p className="text-sm text-muted-foreground">{t('landing.testimonial1.role')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <p className="text-muted-foreground mb-4">{t('landing.testimonial2.quote')}</p>
                             <div className="flex items-center gap-3">
                                <Avatar user={{id: 't2', name: t('landing.testimonial2.author'), email: ''}} className="w-10 h-10"/>
                                <div>
                                    <p className="font-semibold">{t('landing.testimonial2.author')}</p>
                                    <p className="text-sm text-muted-foreground">{t('landing.testimonial2.role')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                 {/* CTA Section */}
                <section className="py-20 text-center bg-secondary rounded-2xl my-20">
                     <h3 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.cta.title')}</h3>
                     <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                        {t('landing.cta.subtitle')}
                    </p>
                    <button 
                        onClick={onLaunch}
                        className="px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-bold hover:bg-primary/90 transition-transform hover:scale-105"
                    >
                        {t('landing.cta.button')}
                    </button>
                </section>

            </main>

            <footer className="text-center py-8 border-t border-border">
                <p className="text-sm text-muted-foreground">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
            </footer>
        </div>
    );
};

export default LandingPage;
