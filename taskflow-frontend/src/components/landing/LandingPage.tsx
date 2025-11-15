'use client'

import React from 'react'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useRouter } from 'next/navigation'
import { ListBulletIcon, RepeatIcon, StopwatchIcon, UserGroupIcon } from '@/lib/constants'

interface LandingPageProps {
  onLaunch: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const { t } = useI18n()
  const router = useRouter()

  const handleGetStarted = () => {
    onLaunch()
    router.push('/auth/login')
  }

  const handleLogin = () => {
    onLaunch()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="p-6 flex items-center justify-between">
        <div className="text-2xl font-bold text-primary">
          {t('app.name') || 'TaskFlow'}
        </div>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-semibold hover:bg-muted"
        >
          {t('landing.hero.login') || t('auth.login') || 'Login'}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          {t('landing.hero.title') || 'Organize Your Life, One Task at a Time'}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
          {t('landing.hero.subtitle') || 'The all-in-one productivity app with task management, habits tracking, and focus tools'}
        </p>
        <button
          onClick={handleGetStarted}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          {t('landing.hero.cta') || 'Get Started Free'}
        </button>
      </section>

      {/* Features Section */}
      <section className="px-6 py-12 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
            {t('landing.features.title') || 'Everything You Need to Stay Productive'}
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            {t('landing.features.subtitle') || 'Powerful features to help you stay organized and focused'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-4">
                <ListBulletIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('landing.features.task.title') || 'Smart Task Management'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('landing.features.task.description') || 'Organize tasks with multiple views: List, Board, Calendar, and Eisenhower Matrix'}
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-4">
                <RepeatIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('landing.features.habit.title') || 'Habit Tracking'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('landing.features.habit.description') || 'Build lasting habits with visual tracking and streaks'}
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-4">
                <StopwatchIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('landing.features.pomodoro.title') || 'Focus Timer'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('landing.features.pomodoro.description') || 'Stay focused with built-in Pomodoro timer and session tracking'}
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-4">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('landing.features.collaboration.title') || 'Team Collaboration'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('landing.features.collaboration.description') || 'Share lists, assign tasks, and comment with your team'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-12 text-center bg-secondary/50">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {t('landing.cta.title') || 'Ready to Boost Your Productivity?'}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('landing.cta.subtitle') || 'Join thousands of users who organize their life with TaskFlow'}
        </p>
        <button
          onClick={handleGetStarted}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          {t('landing.cta.button') || 'Start Free Today'}
        </button>
      </section>
    </div>
  )
}

export default LandingPage

