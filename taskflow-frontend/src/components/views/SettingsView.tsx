'use client'

import React, { useMemo, useState } from 'react'
import { useSettings } from '@/components/providers/settings-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { GripVerticalIcon, HomeIcon, ListBulletIcon, CalendarDaysIcon, GridIcon, RepeatIcon, StopwatchIcon, HourglassIcon, ViewColumnsIcon, CheckIcon } from '@/lib/constants'
import { THEME_PRESETS } from '@/lib/theme-presets'
import type { ThemeOption, View } from '@/types'

const ALL_FEATURES: { view: View, icon: React.FC<{className?: string}>, label: string }[] = [
  { view: 'dashboard', icon: HomeIcon, label: 'feature.dashboard' },
  { view: 'list', icon: ListBulletIcon, label: 'feature.listView' },
  { view: 'board', icon: ViewColumnsIcon, label: 'feature.boardView' },
  { view: 'calendar', icon: CalendarDaysIcon, label: 'feature.calendarView' },
  { view: 'matrix', icon: GridIcon, label: 'feature.matrixView' },
  { view: 'habit', icon: RepeatIcon, label: 'feature.habitTracker' },
  { view: 'pomodoro', icon: StopwatchIcon, label: 'feature.pomodoro' },
  { view: 'countdown', icon: HourglassIcon, label: 'feature.countdown' },
]

const SettingsView: React.FC = () => {
  const { theme, setTheme, language, setLanguage, bottomNavActions, setBottomNavActions } = useSettings()
  const { state: taskState, dispatch: taskDispatch } = useTaskManager()
  const { t } = useI18n()
  const [draggedItem, setDraggedItem] = useState<View | null>(null)
  const [themeFilter, setThemeFilter] = useState<'all' | 'light' | 'dark'>('all')

  const { settings: pomodoroSettings } = taskState.pomodoro

  const themeOptions = useMemo(() => {
    const modeLabels = {
      light: t('settings.themePresets.modeLight'),
      dark: t('settings.themePresets.modeDark'),
      system: t('settings.themePresets.modeSystem'),
    }

    const baseOptions = [
      {
        id: 'system' as ThemeOption,
        label: t('settings.themePresets.system'),
        description: t('settings.themePresets.systemDesc'),
        mode: 'system' as const,
        preview: {
          background: '#101828',
          card: '#ffffff',
          accent: '#6366f1',
        },
      },
    ]

    const presetOptions = THEME_PRESETS.map((preset) => ({
      id: preset.id as ThemeOption,
      label: t(preset.labelKey),
      description: t(preset.descriptionKey),
      mode: preset.mode,
      preview: preset.preview,
    }))

    return [...baseOptions, ...presetOptions].map((option) => ({
      ...option,
      modeLabel: modeLabels[option.mode] ?? option.mode,
    }))
  }, [t])

  const filteredThemeOptions = useMemo(() => {
    if (themeFilter === 'all') return themeOptions
    return themeOptions.filter((option) => option.mode === themeFilter)
  }, [themeFilter, themeOptions])

  const handlePomodoroSettingChange = (setting: string, value: string) => {
    const numberValue = parseInt(value, 10)
    if (!isNaN(numberValue) && numberValue >= 1) {
      // UI shows minutes, state stores minutes (not seconds)
      // Only convert to seconds for remainingTime, not for settings
      taskDispatch({
        type: 'UPDATE_POMODORO_SETTINGS',
        payload: { [setting]: numberValue }
      })
    }
  }

  const handleIntervalChange = (value: string) => {
    const numberValue = parseInt(value, 10)
    if (!isNaN(numberValue) && numberValue >= 1) {
      taskDispatch({
        type: 'UPDATE_POMODORO_SETTINGS',
        payload: { sessionsUntilLongBreak: numberValue }
      })
    }
  }

  const handleDragStart = (view: View) => {
    setDraggedItem(view)
  }

  const handleDrop = (targetList: 'visible' | 'hidden') => {
    if (!draggedItem) return

    const currentActions = bottomNavActions || []
    const isVisible = currentActions.includes(draggedItem)

    if (targetList === 'visible' && !isVisible) {
      if (currentActions.length < 4) {
        setBottomNavActions([...currentActions, draggedItem])
      }
    } else if (targetList === 'hidden' && isVisible) {
      setBottomNavActions(currentActions.filter(v => v !== draggedItem))
    }
    setDraggedItem(null)
  }

  const currentActions = bottomNavActions || []
  const hiddenNavActions = ALL_FEATURES.filter(f => !currentActions.includes(f.view)).map(f => f.view)

  const DraggableItem: React.FC<{ view: View }> = ({ view }) => {
    const feature = ALL_FEATURES.find(f => f.view === view)
    if (!feature) return null
    const Icon = feature.icon
    return (
      <div
        draggable
        onDragStart={() => handleDragStart(view)}
        className="flex items-center gap-3 p-2 bg-secondary rounded-md cursor-grab active:cursor-grabbing"
      >
        <GripVerticalIcon className="h-5 w-5 text-muted-foreground" />
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{t(feature.label)}</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="p-6 border-b border-border flex-shrink-0">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-8 pb-20 md:pb-6">
        <section>
          <h2 className="text-lg font-semibold mb-4">{t('settings.languageLabel')}</h2>
          <div className="bg-card border border-border rounded-lg p-4 max-w-md">
            <div className="flex items-center justify-between">
              <label htmlFor="language-select" className="font-medium text-sm">{t('settings.languageLabel')}</label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
                className="p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="en">{t('settings.language.en')}</option>
                <option value="vi">{t('settings.language.vi')}</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">{t('settings.appearance')}</h2>
          <div className="bg-card border border-border rounded-lg p-4 space-y-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="font-medium">{t('settings.themeLabel')}</label>
                  <p className="text-sm text-muted-foreground">{t('settings.themePresets.helper')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(['all', 'light', 'dark'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setThemeFilter(filter)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        themeFilter === filter
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {filter === 'all'
                        ? t('settings.themePresets.filterAll')
                        : filter === 'light'
                          ? t('settings.themePresets.filterLight')
                          : t('settings.themePresets.filterDark')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredThemeOptions.map((option) => {
                  const isSelected = theme === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTheme(option.id)}
                      aria-pressed={isSelected}
                      className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/60 hover:bg-muted/20'
                      }`}
                    >
                      <div className="w-20">
                        <div className="h-10 rounded-lg border border-black/5 dark:border-white/5 overflow-hidden bg-muted/40">
                          <div className="grid grid-cols-3 h-full">
                            <span className="block h-full w-full" style={{ backgroundColor: option.preview.background }} />
                            <span className="block h-full w-full" style={{ backgroundColor: option.preview.card }} />
                            <span className="block h-full w-full" style={{ backgroundColor: option.preview.accent }} />
                          </div>
                        </div>
                        <p className="mt-1 text-[10px] text-center uppercase tracking-wide text-muted-foreground">
                          {option.modeLabel}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{option.description}</p>
                      </div>
                      {isSelected && (
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground">
                          <CheckIcon className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">{t('settings.bottomNav.title')}</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xl">{t('settings.bottomNav.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop('visible')}
              className="bg-card border border-border rounded-lg p-4"
            >
              <h3 className="font-semibold mb-3">{t('settings.bottomNav.visible')}</h3>
              <div className="space-y-2 min-h-[100px]">
                {currentActions.map(view => <DraggableItem key={view} view={view} />)}
              </div>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop('hidden')}
              className="bg-card border border-border rounded-lg p-4"
            >
              <h3 className="font-semibold mb-3">{t('settings.bottomNav.hidden')}</h3>
              <div className="space-y-2 min-h-[100px]">
                {hiddenNavActions.map(view => <DraggableItem key={view} view={view} />)}
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-lg font-semibold mb-4">{t('settings.pomodoro.title')}</h2>
          <div className="bg-card border border-border rounded-lg p-4 max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="focus-duration" className="font-medium text-sm">{t('settings.pomodoro.focusDuration')}</label>
              <input
                id="focus-duration"
                type="number"
                min="1"
                value={pomodoroSettings.focusDuration}
                onChange={(e) => handlePomodoroSettingChange('focusDuration', e.target.value)}
                className="w-20 p-1.5 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="short-break" className="font-medium text-sm">{t('settings.pomodoro.shortBreak')}</label>
              <input
                id="short-break"
                type="number"
                min="1"
                value={pomodoroSettings.shortBreakDuration}
                onChange={(e) => handlePomodoroSettingChange('shortBreakDuration', e.target.value)}
                className="w-20 p-1.5 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="long-break" className="font-medium text-sm">{t('settings.pomodoro.longBreak')}</label>
              <input
                id="long-break"
                type="number"
                min="1"
                value={pomodoroSettings.longBreakDuration}
                onChange={(e) => handlePomodoroSettingChange('longBreakDuration', e.target.value)}
                className="w-20 p-1.5 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="long-break-interval" className="font-medium text-sm">{t('settings.pomodoro.longBreakInterval')}</label>
              <input
                id="long-break-interval"
                type="number"
                min="1"
                value={pomodoroSettings.sessionsUntilLongBreak}
                onChange={(e) => handleIntervalChange(e.target.value)}
                className="w-20 p-1.5 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

export default SettingsView
