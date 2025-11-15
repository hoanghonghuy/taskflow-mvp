'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { PlusIcon, TrashIcon, CalendarDaysIcon } from '@/lib/constants'
import type { CountdownEvent } from '@/types'
import { DateTimePicker } from '@/components/ui/date-time-picker'

const CountdownView: React.FC = () => {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const [newCountdownName, setNewCountdownName] = useState('')
  const [newCountdownDate, setNewCountdownDate] = useState<Date | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState<Date | null>(null)
  const editingContainerRef = useRef<HTMLDivElement | null>(null)

  const handleAddCountdown = () => {
    if (newCountdownName.trim() && newCountdownDate) {
      dispatch({
        type: 'ADD_COUNTDOWN',
        payload: {
          title: newCountdownName.trim(),
          targetDate: newCountdownDate.toISOString(),
          color: 'bg-blue-500',
        },
      })
      setNewCountdownName('')
      setNewCountdownDate(null)
      setIsAdding(false)
    }
  }

  const startEditing = (event: CountdownEvent) => {
    setEditingId(event.id)
    setEditName(event.title)
    setEditDate(new Date(event.targetDate))
  }

  const handleSaveEdit = useCallback(() => {
    if (editingId && editName.trim() && editDate) {
      dispatch({
        type: 'UPDATE_COUNTDOWN',
        payload: {
          id: editingId,
          title: editName.trim(),
          targetDate: editDate.toISOString(),
          color: 'bg-blue-500',
        },
      })
      setEditingId(null)
      setEditName('')
      setEditDate(null)
    }
  }, [dispatch, editDate, editName, editingId])

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
    setEditDate(null)
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

  const [tick, setTick] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!editingId) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (editingContainerRef.current?.contains(target)) return
      if (target.closest('[data-dtp-content="true"]')) return
      handleSaveEdit()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [editingId, handleSaveEdit])

  const groupedCountdowns = useMemo(() => {
    const upcoming: CountdownEvent[] = []
    const completed: CountdownEvent[] = []
    state.countdownEvents.forEach(event => {
      const { isPast } = calculateTimeRemaining(event.targetDate)
      if (isPast) completed.push(event)
      else upcoming.push(event)
    })
    return { upcoming, completed }
  }, [state.countdownEvents, tick])

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t('nav.countdown')}</h1>
              <p className="text-muted-foreground">{t('countdown.subtitle') || 'Countdown to important events'}</p>
            </div>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>{t('countdown.add')}</span>
              </button>
            )}
          </div>
          {isAdding && (
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newCountdownName}
                onChange={(e) => setNewCountdownName(e.target.value)}
                placeholder={t('countdown.namePlaceholder')}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <DateTimePicker
                value={newCountdownDate}
                onChange={setNewCountdownDate}
                min={new Date()}
                placeholder={t('countdown.selectDate') || 'Select date & time'}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCountdown}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {t('countdown.add')}
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false)
                    setNewCountdownName('')
                    setNewCountdownDate('')
                  }}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  {t('countdown.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
        {state.countdownEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">{t('countdown.noCountdowns')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CalendarDaysIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{t('countdown.upcomingSection') || 'Upcoming events'}</h2>
                <span className="ml-auto text-sm text-muted-foreground">
                  {groupedCountdowns.upcoming.length} {t('countdown.events') || 'events'}
                </span>
              </div>
              {groupedCountdowns.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('countdown.noUpcoming') || 'No upcoming countdowns.'}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedCountdowns.upcoming.map(event => {
                    const timeRemaining = calculateTimeRemaining(event.targetDate)

                    return (
                      <div
                        key={event.id}
                        className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                        ref={editingId === event.id ? editingContainerRef : undefined}
                      >
                        <div className="flex items-center justify-between mb-4">
                          {editingId === event.id ? (
                            <form
                              className="flex-1 flex flex-col gap-2"
                              onSubmit={(e) => {
                                e.preventDefault()
                                handleSaveEdit()
                              }}
                            >
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <DateTimePicker
                                value={editDate}
                                onChange={setEditDate}
                                min={new Date()}
                                placeholder={t('countdown.selectDate') || 'Select date & time'}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground"
                                >
                                  {t('common.save')}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground"
                                >
                                  {t('common.cancel')}
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEditing(event)}
                                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {t('common.edit')}
                                </button>
                                <button
                                  onClick={() => handleDeleteCountdown(event.id)}
                                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                  aria-label={t('countdown.aria.deleteCountdown')}
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {(['days', 'hours', 'minutes', 'seconds'] as const).map(unit => (
                            <div key={unit} className="text-center bg-muted/60 rounded-xl p-3">
                              <p className="text-3xl font-bold">
                                {timeRemaining[unit]}
                              </p>
                              <p className="text-xs font-medium text-muted-foreground">{t(`countdown.${unit}`)}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                          {new Date(event.targetDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {groupedCountdowns.completed.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">{t('countdown.completedSection') || 'Completed events'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedCountdowns.completed.map(event => (
                    <div key={event.id} className="bg-card border border-border rounded-2xl p-4 text-center">
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.targetDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="mt-3 text-sm font-medium text-muted-foreground">{t('countdown.past')}</p>
                      <button
                        onClick={() => handleDeleteCountdown(event.id)}
                        className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-destructive hover:bg-destructive/10"
                      >
                        <TrashIcon className="h-4 w-4" />
                        {t('countdown.delete')}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default CountdownView

