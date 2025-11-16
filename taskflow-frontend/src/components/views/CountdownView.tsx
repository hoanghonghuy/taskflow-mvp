"use client"

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { PlusIcon, TrashIcon, CalendarDaysIcon } from '@/lib/constants'
import type { CountdownEvent } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const INITIAL_TICK = Date.now()

type CountdownColorOption = {
  value: string
  labelKey: TranslationKey
  gradient: string
  accent: string
  softLayer: string
  border: string
}

const COUNTDOWN_LABELS = {
  nameLabel: 'countdown.nameLabel',
  dateLabel: 'countdown.dateLabel',
  colorLabel: 'countdown.colorLabel',
  emptyDescription: 'countdown.emptyDescription',
  nextUp: 'countdown.nextUp',
  progressLabel: 'countdown.progressLabel',
} as const satisfies Record<string, TranslationKey>

const COUNTDOWN_COLOR_KEYS = {
  sky: 'countdown.colors.sky',
  sunset: 'countdown.colors.sunset',
  forest: 'countdown.colors.forest',
  violet: 'countdown.colors.violet',
  amber: 'countdown.colors.amber',
} as const satisfies Record<string, TranslationKey>

const COUNTDOWN_COLOR_OPTIONS = [
  {
    value: 'sky',
    labelKey: COUNTDOWN_COLOR_KEYS.sky,
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.35), rgba(147,197,253,0.28))',
    accent: 'rgba(56,189,248,1)',
    softLayer: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.9)',
  },
  {
    value: 'sunset',
    labelKey: COUNTDOWN_COLOR_KEYS.sunset,
    gradient: 'linear-gradient(135deg, rgba(248,113,113,0.35), rgba(250,204,21,0.24))',
    accent: 'rgba(239,68,68,1)',
    softLayer: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.9)',
  },
  {
    value: 'forest',
    labelKey: COUNTDOWN_COLOR_KEYS.forest,
    gradient: 'linear-gradient(135deg, rgba(45,212,191,0.32), rgba(110,231,183,0.2))',
    accent: 'rgba(34,197,94,1)',
    softLayer: 'rgba(52,211,153,0.12)',
    border: 'rgba(34,197,94,0.9)',
  },
  {
    value: 'violet',
    labelKey: COUNTDOWN_COLOR_KEYS.violet,
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.32), rgba(244,114,182,0.22))',
    accent: 'rgba(168,85,247,1)',
    softLayer: 'rgba(192,132,252,0.12)',
    border: 'rgba(168,85,247,0.9)',
  },
  {
    value: 'amber',
    labelKey: COUNTDOWN_COLOR_KEYS.amber,
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.35), rgba(253,230,138,0.22))',
    accent: 'rgba(245,158,11,1)',
    softLayer: 'rgba(251,191,36,0.12)',
    border: 'rgba(245,158,11,0.9)',
  },
 ] satisfies CountdownColorOption[]

const getColorOption = (value: string | undefined) =>
  COUNTDOWN_COLOR_OPTIONS.find(option => option.value === value) ?? COUNTDOWN_COLOR_OPTIONS[0]

const CountdownView: React.FC = () => {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const [newCountdownName, setNewCountdownName] = useState('')
  const [newCountdownDate, setNewCountdownDate] = useState<Date | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const defaultColor = COUNTDOWN_COLOR_OPTIONS[0].value
  const [newCountdownColor, setNewCountdownColor] = useState<string>(defaultColor)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState<Date | null>(null)
  const [editColor, setEditColor] = useState<string>(defaultColor)
  const editingContainerRef = useRef<HTMLDivElement | null>(null)

  const handleAddCountdown = () => {
    if (newCountdownName.trim() && newCountdownDate) {
      dispatch({
        type: 'ADD_COUNTDOWN',
        payload: {
          title: newCountdownName.trim(),
          targetDate: newCountdownDate.toISOString(),
          color: newCountdownColor,
          createdAt: new Date().toISOString(),
        },
      })
      setNewCountdownName('')
      setNewCountdownDate(null)
      setNewCountdownColor(defaultColor)
      setIsAdding(false)
    }
  }

  const startEditing = (event: CountdownEvent) => {
    setEditingId(event.id)
    setEditName(event.title)
    setEditDate(new Date(event.targetDate))
    setEditColor(getColorOption(event.color).value)
  }

  const handleSaveEdit = useCallback(() => {
    if (editingId && editName.trim() && editDate) {
      const original = state.countdownEvents.find(event => event.id === editingId)
      if (!original) return
      dispatch({
        type: 'UPDATE_COUNTDOWN',
        payload: {
          ...original,
          id: editingId,
          title: editName.trim(),
          targetDate: editDate.toISOString(),
          color: editColor,
        },
      })
      setEditingId(null)
      setEditName('')
      setEditDate(null)
      setEditColor(defaultColor)
    }
  }, [defaultColor, dispatch, editColor, editDate, editName, editingId, state.countdownEvents])

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
    setEditDate(null)
    setEditColor(defaultColor)
  }

  const handleDeleteCountdown = (id: string) => {
    dispatch({ type: 'DELETE_COUNTDOWN', payload: id })
  }

  const [tick, setTick] = useState(INITIAL_TICK)

  const calculateTimeRemaining = (targetDate: string, now: number) => {
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
      const { isPast } = calculateTimeRemaining(event.targetDate, tick)
      if (isPast) completed.push(event)
      else upcoming.push(event)
    })

    upcoming.sort(
      (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    )
    completed.sort(
      (a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime()
    )

    return { upcoming, completed }
  }, [state.countdownEvents, tick])

  const nextUpcomingId = groupedCountdowns.upcoming[0]?.id

  const renderColorPicker = (
    value: string,
    onChange: (color: string) => void,
    controlId: string
  ) => (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={controlId}>
      {COUNTDOWN_COLOR_OPTIONS.map(option => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              isSelected
                ? 'border-transparent ring-2 ring-offset-2 ring-[color:var(--countdown-picker-ring)] text-foreground'
                : 'border-border-subtle/70 text-muted-foreground hover:border-border'
            )}
            style={{
              '--countdown-picker-ring': option.border,
            } as React.CSSProperties}
          >
            <span
              aria-hidden
              className="inline-flex size-6 items-center justify-center rounded-full border border-border/50 shadow-sm"
              style={{ background: option.gradient }}
            />
            <span className="sr-only">{t(option.labelKey)}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-6 border-b border-border shrink-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold">{t('nav.countdown')}</h1>
                <p className="text-muted-foreground">{t('countdown.subtitle')}</p>
              </div>
              {!isAdding && (
                <Button onClick={() => setIsAdding(true)} className="gap-2">
                  <PlusIcon className="h-5 w-5" />
                  <span>{t('countdown.add')}</span>
                </Button>
              )}
            </div>
            {isAdding && (
              <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle/80 bg-card/80 p-4 backdrop-blur">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="space-y-2">
                    <label htmlFor="new-countdown-name" className="text-sm font-medium text-muted-foreground">
                      {t(COUNTDOWN_LABELS.nameLabel)}
                    </label>
                    <Input
                      id="new-countdown-name"
                      value={newCountdownName}
                      onChange={(e) => setNewCountdownName(e.target.value)}
                      placeholder={t('countdown.namePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="new-countdown-date" className="text-sm font-medium text-muted-foreground">
                      {t(COUNTDOWN_LABELS.dateLabel)}
                    </label>
                    <DateTimePicker
                      value={newCountdownDate}
                      onChange={setNewCountdownDate}
                      min={new Date()}
                      placeholder={t('countdown.selectDate')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p id="new-countdown-color" className="text-sm font-medium text-muted-foreground">
                    {t(COUNTDOWN_LABELS.colorLabel)}
                  </p>
                  {renderColorPicker(newCountdownColor, setNewCountdownColor, 'new-countdown-color')}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleAddCountdown} className="gap-2">
                    <PlusIcon className="h-5 w-5" />
                    {t('countdown.add')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsAdding(false)
                      setNewCountdownName('')
                      setNewCountdownDate(null)
                      setNewCountdownColor(defaultColor)
                    }}
                  >
                    {t('countdown.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </header>
      </AppPageContainer>
      <AppPageMain className="py-4 md:py-6">
        {state.countdownEvents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-dashed border-border-subtle/80 bg-card/60 text-muted-foreground">
              <CalendarDaysIcon className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">{t('countdown.noCountdowns')}</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{t(COUNTDOWN_LABELS.emptyDescription)}</p>
            <Button className="mt-6 gap-2" onClick={() => setIsAdding(true)}>
              <PlusIcon className="h-5 w-5" />
              {t('countdown.createFirst')}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CalendarDaysIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{t('countdown.upcomingSection')}</h2>
                <span className="ml-auto text-sm text-muted-foreground">
                  {groupedCountdowns.upcoming.length} {t('countdown.events')}
                </span>
              </div>
              {groupedCountdowns.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('countdown.noUpcoming')}</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {groupedCountdowns.upcoming.map(event => {
                    const timeRemaining = calculateTimeRemaining(event.targetDate, tick)
                    const colorOption = getColorOption(event.color)
                    const isNext = event.id === nextUpcomingId
                    const targetDate = new Date(event.targetDate)

                    return (
                      <Card
                        key={event.id}
                        ref={editingId === event.id ? editingContainerRef : undefined}
                        className="relative overflow-hidden border border-border-subtle/80 bg-card/90 backdrop-blur"
                      >
                        <CardHeader className="flex-row items-start justify-between gap-3">
                          <div className="space-y-1">
                            {editingId === event.id ? (
                              <form
                                className="flex flex-col gap-3"
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  handleSaveEdit()
                                }}
                              >
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="h-10"
                                  autoFocus
                                />
                                <DateTimePicker
                                  value={editDate}
                                  onChange={setEditDate}
                                  min={new Date()}
                                  placeholder={t('countdown.selectDate')}
                                />
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {t(COUNTDOWN_LABELS.colorLabel)}
                                  </p>
                                  {renderColorPicker(editColor, setEditColor, `${event.id}-edit-color`)}
                                </div>
                                <div className="flex gap-2">
                                  <Button type="submit" size="sm" className="px-3">
                                    {t('common.save')}
                                  </Button>
                                  <Button type="button" size="sm" variant="secondary" onClick={cancelEditing}>
                                    {t('common.cancel')}
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <CardTitle className="text-xl font-semibold tracking-tight">
                                  {event.title}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>
                                    {targetDate.toLocaleDateString(undefined, {
                                      weekday: 'long',
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                  <span
                                    className="inline-flex size-2 rounded-full"
                                    style={{ background: colorOption.accent }}
                                    aria-hidden
                                  />
                                </CardDescription>
                              </>
                            )}
                          </div>
                          {editingId !== event.id && (
                            <div className="flex items-center gap-1">
                              {isNext && <Badge variant="secondary">{t(COUNTDOWN_LABELS.nextUp)}</Badge>}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => startEditing(event)}
                              >
                                {t('common.edit')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteCountdown(event.id)}
                                aria-label={t('countdown.aria.deleteCountdown')}
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span className="sr-only">{t('countdown.delete')}</span>
                              </Button>
                            </div>
                          )}
                        </CardHeader>
                        {editingId !== event.id && (
                          <CardContent className="space-y-5">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {(['days', 'hours', 'minutes', 'seconds'] as const).map(unit => (
                                <div
                                  key={unit}
                                  className="rounded-xl border border-border-subtle p-3 text-center"
                                >
                                  <p className="text-3xl font-semibold tracking-tight">
                                    {timeRemaining[unit]}
                                  </p>
                                  <p className="text-xs font-medium uppercase text-muted-foreground/80">
                                    {t(`countdown.${unit}`)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>

            {groupedCountdowns.completed.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">{t('countdown.completedSection')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedCountdowns.completed.map(event => (
                    <Card key={event.id} className="border border-border-subtle/70 bg-card/80 text-center">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold">{event.title}</CardTitle>
                        <CardDescription>
                          {new Date(event.targetDate).toLocaleDateString(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium text-muted-foreground">{t('countdown.past')}</p>
                      </CardContent>
                      <CardFooter className="justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCountdown(event.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          {t('countdown.delete')}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </AppPageMain>
    </AppPage>
  )
}

export default CountdownView

