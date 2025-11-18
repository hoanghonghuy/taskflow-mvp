'use client'

import React, { useMemo, useState } from 'react'
import { useSettings } from '@/components/providers/settings-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { HomeIcon, ListBulletIcon, CalendarDaysIcon, GridIcon, RepeatIcon, StopwatchIcon, HourglassIcon, ViewColumnsIcon, CheckIcon } from '@/lib/icons'
import { THEME_PRESETS } from '@/lib/theme-presets'
import type { ThemeOption, View } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'

const ALL_FEATURES: { view: View, icon: React.FC<{className?: string}>, label: TranslationKey }[] = [
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
  const { settings, updateSettings, theme, setTheme, language, setLanguage, bottomNavActions, setBottomNavActions } = useSettings()
  const { state: taskState, dispatch: taskDispatch } = useTaskManager()
  const { t } = useI18n()
  const [themeFilter, setThemeFilter] = useState<'all' | 'light' | 'dark'>('all')
  const [showGeminiHelp, setShowGeminiHelp] = useState(false)

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

  const stepPomodoroSetting = (setting: 'focusDuration' | 'shortBreakDuration' | 'longBreakDuration', delta: number) => {
    const current = pomodoroSettings[setting]
    const next = Math.max(1, current + delta)
    taskDispatch({
      type: 'UPDATE_POMODORO_SETTINGS',
      payload: { [setting]: next },
    })
  }

  const stepInterval = (delta: number) => {
    const current = pomodoroSettings.sessionsUntilLongBreak
    const next = Math.max(1, current + delta)
    taskDispatch({
      type: 'UPDATE_POMODORO_SETTINGS',
      payload: { sessionsUntilLongBreak: next },
    })
  }

  const currentActions = bottomNavActions || []
  const maxVisibleBottomNav = 4

  const handleBottomNavToggle = (view: View) => {
    const actions = bottomNavActions || []
    const isVisible = actions.includes(view)

    if (isVisible) {
      setBottomNavActions(actions.filter((v) => v !== view))
    } else {
      if (actions.length >= maxVisibleBottomNav) return
      setBottomNavActions([...actions, view])
    }
  }

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-6 border-b border-border shrink-0 hidden md:block">
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </header>
      </AppPageContainer>
      <AppPageMain className="py-4 md:py-6 space-y-8">
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
          <h2 className="text-lg font-semibold mb-4">{t('settings.gemini.title')}</h2>
          <div className="bg-card border border-border rounded-lg p-4 max-w-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <label htmlFor="gemini-api-key" className="font-medium text-sm flex items-center gap-2">
                  {t('settings.gemini.label')}
                  <button
                    type="button"
                    onClick={() => setShowGeminiHelp((v) => !v)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted/60 text-[10px] font-semibold text-muted-foreground hover:bg-muted"
                    aria-label={t('settings.gemini.helpTitle')}
                  >
                    ?
                  </button>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settings.gemini.description')}
                </p>
              </div>
            </div>
            <Input
              id="gemini-api-key"
              type="password"
              autoComplete="off"
              value={settings.geminiApiKey ?? ''}
              onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
              placeholder={t('settings.gemini.placeholder')}
            />
            {showGeminiHelp && (
              <div className="mt-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold">{t('settings.gemini.helpTitle')}</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-2 font-medium hover:text-primary/90"
                    >
                      {t('settings.gemini.helpStep1')}
                    </a>
                  </li>
                  <li>{t('settings.gemini.helpStep2')}</li>
                  <li>{t('settings.gemini.helpStep3')}</li>
                  <li>{t('settings.gemini.helpStep4')}</li>
                </ol>
              </div>
            )}
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
          <div className="bg-card border border-border rounded-lg p-4 max-w-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t('settings.bottomNav.visible')}</h3>
              <span className="text-xs text-muted-foreground">
                {currentActions.length} / {maxVisibleBottomNav}
              </span>
            </div>
            <div className="space-y-2">
              {ALL_FEATURES.map((feature) => {
                const isVisible = currentActions.includes(feature.view)
                const Icon = feature.icon
                const disabled = !isVisible && currentActions.length >= maxVisibleBottomNav

                return (
                  <div
                    key={feature.view}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-disabled={disabled || undefined}
                    onClick={() => {
                      if (disabled) return
                      handleBottomNavToggle(feature.view)
                    }}
                    onKeyDown={(e) => {
                      if (disabled) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleBottomNavToggle(feature.view)
                      }
                    }}
                    className={`flex items-center justify-between w-full rounded-lg border px-3 py-2 text-left transition-all ${
                      isVisible
                        ? 'bg-primary/10 border-primary/80 text-primary shadow-[0_0_0_1px_hsl(var(--color-primary)/0.45)]'
                        : 'bg-secondary/40 border-border hover:bg-secondary/70 hover:border-primary/40'
                    } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${isVisible ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${!isVisible ? 'text-foreground' : ''}`}>{t(feature.label)}</span>
                    </div>
                    <div
                      className="flex items-center"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <Switch
                        checked={isVisible}
                        onCheckedChange={() => handleBottomNavToggle(feature.view)}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-lg font-semibold mb-1">{t('settings.pomodoro.title')}</h2>
          <p className="text-xs text-muted-foreground mb-3">
            {t('settings.pomodoro.note' as TranslationKey)}
          </p>
          <div className="bg-card border border-border rounded-lg p-4 max-w-md space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="focus-duration" className="font-medium text-sm">{t('settings.pomodoro.focusDuration')}</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepPomodoroSetting('focusDuration', -1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Decrease focus duration"
                >
                  –
                </button>
                <input
                  id="focus-duration"
                  type="number"
                  min="1"
                  value={pomodoroSettings.focusDuration}
                  onChange={(e) => handlePomodoroSettingChange('focusDuration', e.target.value)}
                  className="w-16 px-2 py-1 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                />
                <button
                  type="button"
                  onClick={() => stepPomodoroSetting('focusDuration', 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Increase focus duration"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="short-break" className="font-medium text-sm">{t('settings.pomodoro.shortBreak')}</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepPomodoroSetting('shortBreakDuration', -1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Decrease short break duration"
                >
                  –
                </button>
                <input
                  id="short-break"
                  type="number"
                  min="1"
                  value={pomodoroSettings.shortBreakDuration}
                  onChange={(e) => handlePomodoroSettingChange('shortBreakDuration', e.target.value)}
                  className="w-16 px-2 py-1 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                />
                <button
                  type="button"
                  onClick={() => stepPomodoroSetting('shortBreakDuration', 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Increase short break duration"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="long-break" className="font-medium text-sm">{t('settings.pomodoro.longBreak')}</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepPomodoroSetting('longBreakDuration', -1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Decrease long break duration"
                >
                  –
                </button>
                <input
                  id="long-break"
                  type="number"
                  min="1"
                  value={pomodoroSettings.longBreakDuration}
                  onChange={(e) => handlePomodoroSettingChange('longBreakDuration', e.target.value)}
                  className="w-16 px-2 py-1 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                />
                <button
                  type="button"
                  onClick={() => stepPomodoroSetting('longBreakDuration', 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Increase long break duration"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="long-break-interval" className="font-medium text-sm">{t('settings.pomodoro.longBreakInterval')}</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepInterval(-1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Decrease sessions until long break"
                >
                  –
                </button>
                <input
                  id="long-break-interval"
                  type="number"
                  min="1"
                  value={pomodoroSettings.sessionsUntilLongBreak}
                  onChange={(e) => handleIntervalChange(e.target.value)}
                  className="w-16 px-2 py-1 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                />
                <button
                  type="button"
                  onClick={() => stepInterval(1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Increase sessions until long break"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </section>
        
        <NotificationSettings />

      </AppPageMain>
    </AppPage>
  )
}

export default SettingsView
