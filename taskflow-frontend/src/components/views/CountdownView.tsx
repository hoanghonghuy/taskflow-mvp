'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { PlusIcon, TrashIcon } from '@/lib/constants'
import type { CountdownEvent } from '@/types'

const CountdownView: React.FC = () => {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const [newCountdownName, setNewCountdownName] = useState('')
  const [newCountdownDate, setNewCountdownDate] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddCountdown = () => {
    if (newCountdownName.trim() && newCountdownDate) {
      dispatch({
        type: 'ADD_COUNTDOWN',
        payload: {
          title: newCountdownName.trim(),
          targetDate: new Date(newCountdownDate).toISOString(),
          color: 'bg-blue-500',
        },
      })
      setNewCountdownName('')
      setNewCountdownDate('')
      setIsAdding(false)
    }
  }

  const handleDeleteCountdown = (id: string) => {
    dispatch({ type: 'DELETE_COUNTDOWN', payload: id })
  }

  const calculateTimeRemaining = (targetDate: string) => {
    const now = new Date().getTime()
    const target = new Date(targetDate).getTime()
    const diff = target - now

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, isPast: false }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.countdown')}</h1>
            <p className="text-muted-foreground">Countdown to important events</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('countdown.add') || 'Add Countdown'}</span>
            </button>
          )}
        </div>
        {isAdding && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newCountdownName}
              onChange={(e) => setNewCountdownName(e.target.value)}
              placeholder={t('countdown.namePlaceholder') || 'Event name'}
              className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={newCountdownDate}
              onChange={(e) => setNewCountdownDate(e.target.value)}
              className="px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleAddCountdown}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t('countdown.add') || 'Add'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewCountdownName('')
                setNewCountdownDate('')
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors"
            >
              {t('countdown.cancel') || 'Cancel'}
            </button>
          </div>
        )}
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
        {state.countdownEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">{t('countdown.noCountdowns') || 'No countdowns yet. Add one to get started!'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.countdownEvents.map(event => {
              const timeRemaining = calculateTimeRemaining(event.targetDate)

              return (
                <div key={event.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <button
                      onClick={() => handleDeleteCountdown(event.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete countdown"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {timeRemaining.isPast ? (
                    <div className="text-center py-4">
                      <p className="text-2xl font-bold text-muted-foreground">
                        {t('countdown.past') || 'Event has passed'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{timeRemaining.days}</p>
                        <p className="text-xs text-muted-foreground">{t('countdown.days') || 'Days'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{timeRemaining.hours}</p>
                        <p className="text-xs text-muted-foreground">{t('countdown.hours') || 'Hours'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{timeRemaining.minutes}</p>
                        <p className="text-xs text-muted-foreground">{t('countdown.minutes') || 'Minutes'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{timeRemaining.seconds}</p>
                        <p className="text-xs text-muted-foreground">{t('countdown.seconds') || 'Seconds'}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    {new Date(event.targetDate).toLocaleDateString()}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default CountdownView

