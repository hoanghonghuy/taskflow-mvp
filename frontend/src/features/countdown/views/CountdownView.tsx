"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useCountdown } from '@/lib/hooks/use-countdown'
import { useI18n } from '@/lib/i18n/hooks'
import { useSettings } from '@/components/providers/settings-provider'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import { PlusIcon, TrashIcon, CalendarDaysIcon } from '@/lib/icons'
import type { CountdownEvent } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const COUNTDOWN_LABELS = {
  nameLabel: 'countdown.nameLabel',
  dateLabel: 'countdown.dateLabel',
  colorLabel: 'countdown.colorLabel',
  emptyDescription: 'countdown.emptyDescription',
  nextUp: 'countdown.nextUp',
} as const satisfies Record<string, TranslationKey>

type CountdownDisplayMode = 'detailed' | 'days' | 'months' | 'years'

const COUNTDOWN_VIEW_MODE_LABELS = {
  detailed: 'countdown.viewMode.detailed',
  days: 'countdown.viewMode.days',
  months: 'countdown.viewMode.months',
  years: 'countdown.viewMode.years',
} as const satisfies Record<CountdownDisplayMode, TranslationKey>

const CountdownView: React.FC = () => {
  const { t } = useI18n()
  const { settings } = useSettings()
  const locale = settings.language || undefined
  const { confirm } = useConfirmation()
  const {
    upcomingEvents,
    completedEvents,
    eventsWithTimeLeft,
    colorOptions,
    getColorOption,
    addCountdown,
    updateCountdown,
    deleteCountdown,
  } = useCountdown()

  const [isAdding, setIsAdding] = useState(false)
  const [newCountdownName, setNewCountdownName] = useState('')
  const [newCountdownDate, setNewCountdownDate] = useState<Date | null>(null)
  const [newCountdownColor, setNewCountdownColor] = useState<string>(colorOptions[0].value)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState<Date | null>(null)
  const [editColor, setEditColor] = useState<string>(colorOptions[0].value)
  const editingContainerRef = useRef<HTMLDivElement | null>(null)
  const [displayMode, setDisplayMode] = useState<CountdownDisplayMode>('detailed')

  const handleAddCountdown = () => {
    if (newCountdownName.trim() && newCountdownDate) {
      addCountdown({
        title: newCountdownName.trim(),
        targetDate: newCountdownDate.toISOString(),
        color: newCountdownColor,
      })
      resetNewCountdownForm()
    }
  }

  const resetNewCountdownForm = () => {
    setNewCountdownName('')
    setNewCountdownDate(null)
    setNewCountdownColor(colorOptions[0].value)
    setIsAdding(false)
  }

  const startEditing = (event: CountdownEvent) => {
    setEditingId(event.id)
    setEditName(event.title)
    setEditDate(new Date(event.targetDate))
    setEditColor(getColorOption(event.color).value)
  }

  const handleSaveEdit = useCallback(() => {
    if (editingId && editName.trim() && editDate) {
      updateCountdown(editingId, {
        title: editName.trim(),
        targetDate: editDate.toISOString(),
        color: editColor,
      })
      setEditingId(null)
      setEditName('')
      setEditDate(null)
      setEditColor(colorOptions[0].value)
    }
  }, [editColor, editDate, editName, editingId, updateCountdown, colorOptions])

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
    setEditDate(null)
    setEditColor(colorOptions[0].value)
  }

  const handleDeleteCountdown = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: t('countdown.deleteConfirm.title' as TranslationKey, { name }),
      description: t('countdown.deleteConfirm.description' as TranslationKey, { name }),
      confirmText: t('countdown.deleteConfirm.confirm' as TranslationKey),
      cancelText: t('common.cancel' as TranslationKey),
      variant: 'destructive',
    })

    if (!isConfirmed) return
    deleteCountdown(id)
  }

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

  const nextUpcomingId = upcomingEvents[0]?.id

  const renderTimeGrid = (timeLeft: { days: number; hours: number; minutes: number; seconds: number; total: number; isPast: boolean }) => {
    const totalDays = Math.max(0, Math.ceil(timeLeft.total / (1000 * 60 * 60 * 24)))
    const totalMonths = Math.max(0, Math.floor(totalDays / 30))
    const totalYears = Math.max(0, Math.floor(totalDays / 365))

    if (displayMode === 'days') {
      return (
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-border-subtle bg-secondary/50 p-3 text-center">
            <p className="text-3xl font-semibold tracking-tight">{totalDays}</p>
            <p className="text-xs font-medium uppercase text-muted-foreground/80">{t('countdown.days')}</p>
          </div>
        </div>
      )
    }

    if (displayMode === 'months') {
      const value = totalMonths >= 1 ? totalMonths : totalDays
      const unitKey = totalMonths >= 1 ? 'months' : 'days'

      return (
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-border-subtle bg-secondary/50 p-3 text-center">
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            <p className="text-xs font-medium uppercase text-muted-foreground/80">{t(`countdown.${unitKey}`)}</p>
          </div>
        </div>
      )
    }

    if (displayMode === 'years') {
      let value = totalYears
      let unitKey: 'years' | 'months' | 'days' = 'years'

      if (totalYears >= 1) {
        value = totalYears
        unitKey = 'years'
      } else if (totalMonths >= 1) {
        value = totalMonths
        unitKey = 'months'
      } else {
        value = totalDays
        unitKey = 'days'
      }

      return (
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-border-subtle p-3 text-center">
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            <p className="text-xs font-medium uppercase text-muted-foreground/80">{t(`countdown.${unitKey}`)}</p>
          </div>
        </div>
      )
    }

    // detailed: days / hours / minutes (no seconds)
    return (
      <div className="grid grid-cols-3 gap-3">
        {(['days', 'hours', 'minutes'] as const).map(unit => (
          <div
            key={unit}
            className="rounded-xl border border-border-subtle bg-secondary/50 p-3 text-center"
          >
            <p className="text-3xl font-semibold tracking-tight">
              {timeLeft[unit]}
            </p>
            <p className="text-xs font-medium uppercase text-muted-foreground/80">
              {t(`countdown.${unit}`)}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const renderColorPicker = (
    value: string,
    onChange: (color: string) => void,
    controlId: string
  ) => (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={controlId}>
      {colorOptions.map(option => {
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
                ? 'border-transparent ring-2 ring-offset-2 ring-(--countdown-picker-ring) text-foreground'
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
              <div className="hidden md:block">
                <h1 className="text-2xl md:text-3xl font-bold">{t('nav.countdown')}</h1>
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
                    onClick={resetNewCountdownForm}
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
        {upcomingEvents.length === 0 ? (
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
                  {upcomingEvents.length} {t('countdown.events')}
                </span>
                <div className="ml-2 flex items-center gap-1 text-xs">
                  <span className="hidden sm:inline text-muted-foreground">
                    {t('countdown.viewAs')}
                  </span>
                  <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5">
                    {(['detailed', 'days', 'months', 'years'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDisplayMode(mode)}
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${
                          displayMode === mode
                            ? 'bg-background text-primary border-2 border-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-background/60 border-transparent'
                        }`}
                      >
                        {t(COUNTDOWN_VIEW_MODE_LABELS[mode])}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('countdown.noUpcoming')}</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {eventsWithTimeLeft.filter(event => !event.timeLeft.isPast).map(event => {
                    const isNext = event.id === nextUpcomingId
                    const targetDate = new Date(event.targetDate)

                    return (
                      <Card
                        key={event.id}
                        ref={editingId === event.id ? editingContainerRef : undefined}
                        className="relative overflow-hidden"
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
                                    {targetDate.toLocaleDateString(locale, {
                                      weekday: 'long',
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                  <span
                                    className="inline-flex size-2 rounded-full"
                                    style={{ background: event.colorOption.accent }}
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
                                onClick={() => handleDeleteCountdown(event.id, event.title)}
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
                            {renderTimeGrid(event.timeLeft)}
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>

            {completedEvents.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">{t('countdown.completedSection')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedEvents.map(event => (
                    <Card key={event.id} className="text-center">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold">{event.title}</CardTitle>
                        <CardDescription>
                          {new Date(event.targetDate).toLocaleDateString(locale, {
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
                          onClick={() => handleDeleteCountdown(event.id, event.title)}
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

