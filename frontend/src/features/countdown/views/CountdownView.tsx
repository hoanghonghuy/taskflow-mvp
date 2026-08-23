'use client'

import React, { useState } from 'react'
import { useCountdown } from '@/lib/hooks/use-countdown'
import { useI18n } from '@/lib/i18n/hooks'
import { useSettings } from '@/components/providers/settings-provider'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import { CalendarDaysIcon, PlusIcon, TrashIcon } from '@/lib/icons'
import type { CountdownEvent } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SegmentedControl } from '@/components/ui/segmented-control'
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
  const [isCreating, setIsCreating] = useState(false)
  const [newCountdownName, setNewCountdownName] = useState('')
  const [newCountdownDate, setNewCountdownDate] = useState<Date | null>(null)
  const [newCountdownColor, setNewCountdownColor] = useState(colorOptions[0].value)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState<Date | null>(null)
  const [editColor, setEditColor] = useState(colorOptions[0].value)
  const [displayMode, setDisplayMode] = useState<CountdownDisplayMode>('detailed')

  const resetNewCountdownForm = () => {
    setNewCountdownName('')
    setNewCountdownDate(null)
    setNewCountdownColor(colorOptions[0].value)
    setIsAdding(false)
  }

  const handleAddCountdown = async () => {
    const title = newCountdownName.trim()
    if (!title || !newCountdownDate || isCreating) return

    setIsCreating(true)
    try {
      const saved = await addCountdown({
        title,
        targetDate: newCountdownDate.toISOString(),
        color: newCountdownColor,
      })
      if (saved) resetNewCountdownForm()
    } finally {
      setIsCreating(false)
    }
  }

  const startEditing = (event: CountdownEvent) => {
    setEditingId(event.id)
    setEditName(event.title)
    setEditDate(new Date(event.targetDate))
    setEditColor(getColorOption(event.color).value)
  }

  const cancelEditing = () => {
    if (savingId) return
    setEditingId(null)
    setEditName('')
    setEditDate(null)
    setEditColor(colorOptions[0].value)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim() || !editDate || savingId) return

    setSavingId(editingId)
    try {
      const saved = await updateCountdown(editingId, {
        title: editName.trim(),
        targetDate: editDate.toISOString(),
        color: editColor,
      })
      if (saved) cancelEditingAfterSave()
    } finally {
      setSavingId(null)
    }
  }

  const cancelEditingAfterSave = () => {
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
    if (isConfirmed) void deleteCountdown(id)
  }

  const renderColorPicker = (
    value: string,
    onChange: (color: string) => void,
    controlId: string,
  ) => (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={controlId}>
      {colorOptions.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={t(option.labelKey)}
            title={t(option.labelKey)}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border transition-[border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
              isSelected
                ? 'border-transparent ring-2 ring-offset-2 ring-(--countdown-picker-ring)'
                : 'border-border/70 hover:scale-105 hover:border-border',
            )}
            style={{ '--countdown-picker-ring': option.border } as React.CSSProperties}
          >
            <span
              aria-hidden
              className="h-6 w-6 rounded-full border border-border/40 shadow-sm"
              style={{ background: option.gradient }}
            />
          </button>
        )
      })}
    </div>
  )

  const renderTimeGrid = (timeLeft: {
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
    isPast: boolean
  }) => {
    const totalDays = Math.max(0, Math.ceil(timeLeft.total / 86_400_000))
    const totalMonths = Math.max(0, Math.floor(totalDays / 30))
    const totalYears = Math.max(0, Math.floor(totalDays / 365))

    if (displayMode !== 'detailed') {
      let value = totalDays
      let unit: 'days' | 'months' | 'years' = 'days'
      if (displayMode === 'months' && totalMonths >= 1) {
        value = totalMonths
        unit = 'months'
      } else if (displayMode === 'years') {
        if (totalYears >= 1) {
          value = totalYears
          unit = 'years'
        } else if (totalMonths >= 1) {
          value = totalMonths
          unit = 'months'
        }
      }

      return (
        <div className="rounded-xl border border-border/60 bg-secondary/35 p-4 text-center">
          <p className="text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {t(`countdown.${unit}` as TranslationKey)}
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(['days', 'hours', 'minutes'] as const).map((unit) => (
          <div key={unit} className="rounded-xl border border-border/60 bg-secondary/35 p-3 text-center">
            <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {timeLeft[unit]}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
              {t(`countdown.${unit}` as TranslationKey)}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const nextUpcomingId = upcomingEvents[0]?.id
  const upcomingWithTime = eventsWithTimeLeft.filter((event) => !event.timeLeft.isPast)

  return (
    <AppPage>
      <AppPageHeader
        title={t('nav.countdown')}
        subtitle={t('countdown.subtitle')}
        hideOnMobile={false}
        actions={
          !isAdding ? (
            <Button type="button" size="sm" onClick={() => setIsAdding(true)} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              {t('countdown.add')}
            </Button>
          ) : null
        }
      />

      <AppPageMain className="space-y-6 py-4 md:py-6">
        {isAdding && (
          <section className="rounded-xl border border-primary/30 bg-card p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
              <div className="space-y-2">
                <label htmlFor="new-countdown-name" className="text-sm font-medium">
                  {t(COUNTDOWN_LABELS.nameLabel)}
                </label>
                <Input
                  id="new-countdown-name"
                  value={newCountdownName}
                  onChange={(event) => setNewCountdownName(event.target.value)}
                  placeholder={t('countdown.namePlaceholder')}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t(COUNTDOWN_LABELS.dateLabel)}</p>
                <DateTimePicker
                  value={newCountdownDate}
                  onChange={setNewCountdownDate}
                  min={new Date()}
                  placeholder={t('countdown.selectDate')}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p id="new-countdown-color" className="text-sm font-medium">
                {t(COUNTDOWN_LABELS.colorLabel)}
              </p>
              {renderColorPicker(newCountdownColor, setNewCountdownColor, 'new-countdown-color')}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void handleAddCountdown()}
                disabled={!newCountdownName.trim() || !newCountdownDate || isCreating}
                className="gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                {t('countdown.add')}
              </Button>
              <Button type="button" variant="outline" onClick={resetNewCountdownForm} disabled={isCreating}>
                {t('countdown.cancel')}
              </Button>
            </div>
          </section>
        )}

        {upcomingEvents.length === 0 && completedEvents.length === 0 ? (
          <EmptyState
            className="py-16"
            icon={<CalendarDaysIcon className="h-8 w-8" />}
            title={t('countdown.noCountdowns')}
            description={t(COUNTDOWN_LABELS.emptyDescription)}
            action={
              <Button type="button" className="gap-2" onClick={() => setIsAdding(true)}>
                <PlusIcon className="h-4 w-4" />
                {t('countdown.createFirst')}
              </Button>
            }
          />
        ) : (
          <>
            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{t('countdown.upcomingSection')}</h2>
                  <Badge variant="secondary">{upcomingEvents.length}</Badge>
                </div>
                <SegmentedControl
                  shape="pill"
                  size="sm"
                  aria-label={t('countdown.viewAs')}
                  value={displayMode}
                  onValueChange={setDisplayMode}
                  options={(['detailed', 'days', 'months', 'years'] as const).map((mode) => ({
                    value: mode,
                    label: t(COUNTDOWN_VIEW_MODE_LABELS[mode]),
                  }))}
                />
              </div>

              {upcomingWithTime.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('countdown.noUpcoming')}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {upcomingWithTime.map((event) => {
                    const isNext = event.id === nextUpcomingId
                    const isEditing = editingId === event.id
                    const isSaving = savingId === event.id
                    const targetDate = new Date(event.targetDate)

                    return (
                      <Card
                        key={event.id}
                        className={cn(
                          'relative overflow-hidden transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none',
                          isNext && 'border-primary/30 shadow-sm',
                        )}
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-1"
                          style={{ background: event.colorOption.gradient }}
                          aria-hidden
                        />
                        <CardHeader className="pb-3 pt-5">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor={`countdown-title-${event.id}`}>
                                  {t(COUNTDOWN_LABELS.nameLabel)}
                                </label>
                                <Input
                                  id={`countdown-title-${event.id}`}
                                  value={editName}
                                  onChange={(changeEvent) => setEditName(changeEvent.target.value)}
                                  autoFocus
                                />
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">{t(COUNTDOWN_LABELS.dateLabel)}</p>
                                <DateTimePicker
                                  value={editDate}
                                  onChange={setEditDate}
                                  min={new Date()}
                                  placeholder={t('countdown.selectDate')}
                                />
                              </div>
                              <div className="space-y-2">
                                <p id={`${event.id}-edit-color`} className="text-sm font-medium">
                                  {t(COUNTDOWN_LABELS.colorLabel)}
                                </p>
                                {renderColorPicker(editColor, setEditColor, `${event.id}-edit-color`)}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => void handleSaveEdit()}
                                  disabled={!editName.trim() || !editDate || isSaving}
                                >
                                  {t('common.save')}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  disabled={isSaving}
                                >
                                  {t('common.cancel')}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <CardTitle className="truncate text-lg">{event.title}</CardTitle>
                                  {isNext && <Badge variant="secondary">{t(COUNTDOWN_LABELS.nextUp)}</Badge>}
                                </div>
                                <CardDescription className="mt-1">
                                  {targetDate.toLocaleDateString(locale, {
                                    weekday: 'short',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                  {' · '}
                                  {targetDate.toLocaleTimeString(locale, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </CardDescription>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => startEditing(event)}>
                                {t('common.edit')}
                              </Button>
                            </div>
                          )}
                        </CardHeader>

                        {!isEditing && (
                          <CardContent className="space-y-4">
                            {renderTimeGrid(event.timeLeft)}
                            <div className="flex justify-end border-t border-border/50 pt-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => void handleDeleteCountdown(event.id, event.title)}
                              >
                                <TrashIcon className="h-4 w-4" />
                                {t('countdown.delete')}
                              </Button>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>

            {completedEvents.length > 0 && (
              <section className="border-t border-border/60 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{t('countdown.completedSection')}</h2>
                  <Badge variant="secondary">{completedEvents.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {completedEvents.map((event) => (
                    <Card key={event.id} className="opacity-80">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{event.title}</CardTitle>
                        <CardDescription>
                          {new Date(event.targetDate).toLocaleDateString(locale, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">{t('countdown.past')}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => void handleDeleteCountdown(event.id, event.title)}
                          aria-label={t('countdown.aria.deleteCountdown')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </AppPageMain>
    </AppPage>
  )
}

export default CountdownView
