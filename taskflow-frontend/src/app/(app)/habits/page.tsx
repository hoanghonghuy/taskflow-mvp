'use client'

import React from 'react'
import { useI18n } from '@/lib/hooks/use-i18n'

export default function HabitsPage() {
  const { t } = useI18n()

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold">{t('nav.habits')}</h1>
        <p className="text-muted-foreground">Track your daily habits</p>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
        <div className="text-center text-muted-foreground">
          <p>Habits view will be implemented soon...</p>
        </div>
      </main>
    </div>
  )
}

