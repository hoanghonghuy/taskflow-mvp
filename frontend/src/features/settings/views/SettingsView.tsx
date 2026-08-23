'use client'

import React, { useMemo, useState } from 'react'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { useSettings } from '@/components/providers/settings-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { usePomodoroActions } from '@/components/providers/task-manager-provider'
import { CheckIcon } from '@/lib/icons'
import { THEME_PRESETS } from '@/lib/theme-presets'
import type { ThemeOption, View } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { Switch, SwitchField } from '@/components/ui/switch'
import { SettingsList, SettingsNumberStepper } from '@/components/ui/settings-list'
import { SettingsSection } from '@/components/ui/settings-section'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { APP_FEATURES } from '@/lib/navigation/features'
import { cn } from '@/lib/utils'

const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    bottomNavActions,
    setBottomNavActions,
    settings,
    updateSettings,
  } = useSettings()
  const { state: taskState } = useTaskManager()
  const { updateSettings: updatePomodoroSettings } = usePomodoroActions()
  const { t } = useI18n()
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

  const handlePomodoroSettingChange = (
    setting: 'focusDuration' | 'shortBreakDuration' | 'longBreakDuration',
    value: string,
  ) => {
    const numberValue = parseInt(value, 10)
    if (!Number.isNaN(numberValue) && numberValue >= 1) {
      void updatePomodoroSettings({ [setting]: numberValue })
    }
  }

  const handleIntervalChange = (value: string) => {
    const numberValue = parseInt(value, 10)
    if (!Number.isNaN(numberValue) && numberValue >= 1) {
      void updatePomodoroSettings({ sessionsUntilLongBreak: numberValue })
    }
  }

  const stepPomodoroSetting = (
    setting: 'focusDuration' | 'shortBreakDuration' | 'longBreakDuration',
    delta: number,
  ) => {
    const next = Math.max(1, pomodoroSettings[setting] + delta)
    void updatePomodoroSettings({ [setting]: next })
  }

  const stepInterval = (delta: number) => {
    const next = Math.max(1, pomodoroSettings.sessionsUntilLongBreak + delta)
    void updatePomodoroSettings({ sessionsUntilLongBreak: next })
  }

  const currentActions = bottomNavActions || []
  const maxVisibleBottomNav = 4

  const handleBottomNavToggle = (view: View) => {
    const actions = bottomNavActions || []
    const isVisible = actions.includes(view)

    if (isVisible) {
      setBottomNavActions(actions.filter((item) => item !== view))
      return
    }

    if (actions.length < maxVisibleBottomNav) {
      setBottomNavActions([...actions, view])
    }
  }

  return (
    <AppPage>
      <AppPageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        titleSize="md"
        hideOnMobile={false}
      />

      <AppPageMain className="space-y-6 py-4 md:space-y-8 md:py-6">
        <SettingsSection
          title={t('settings.general')}
          maxWidthClassName="max-w-2xl"
          contentClassName="space-y-1"
        >
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t('settings.languageLabel')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('settings.languageHelper')}</p>
            </div>
            <LanguageToggle showIcon={false} size="md" />
          </div>
        </SettingsSection>

        <SettingsSection
          title={t('settings.appearance')}
          maxWidthClassName=""
          contentClassName="space-y-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-medium">{t('settings.themeLabel')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('settings.themePresets.helper')}</p>
            </div>
            <SegmentedControl
              shape="pill"
              size="sm"
              aria-label={t('settings.themeLabel')}
              value={themeFilter}
              onValueChange={setThemeFilter}
              options={[
                { value: 'all', label: t('settings.themePresets.filterAll') },
                { value: 'light', label: t('settings.themePresets.filterLight') },
                { value: 'dark', label: t('settings.themePresets.filterDark') },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredThemeOptions.map((option) => {
              const isSelected = theme === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    'group flex min-h-24 items-center gap-3 rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/70 hover:border-primary/40 hover:bg-muted/20',
                  )}
                >
                  <div className="w-20 shrink-0">
                    <div className="h-10 overflow-hidden rounded-lg border border-black/5 bg-muted/40 dark:border-white/5">
                      <div className="grid h-full grid-cols-3">
                        <span style={{ backgroundColor: option.preview.background }} />
                        <span style={{ backgroundColor: option.preview.card }} />
                        <span style={{ backgroundColor: option.preview.accent }} />
                      </div>
                    </div>
                    <p className="mt-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                      {option.modeLabel}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </SettingsSection>

        <SettingsSection
          title={t('settings.bottomNav.title')}
          description={t('settings.bottomNav.subtitle')}
          maxWidthClassName="max-w-2xl"
          contentClassName="space-y-3"
        >
          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
            <span className="text-sm font-medium">{t('settings.bottomNav.visible')}</span>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {currentActions.length}/{maxVisibleBottomNav}
            </span>
          </div>

          <div className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-card">
            {APP_FEATURES.map((feature) => {
              const isVisible = currentActions.includes(feature.view)
              const Icon = feature.icon
              const disabled = !isVisible && currentActions.length >= maxVisibleBottomNav

              return (
                <div
                  key={feature.view}
                  className={cn(
                    'flex min-h-14 items-center justify-between gap-3 px-3 py-2.5 sm:px-4',
                    disabled && 'opacity-50',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{t(feature.label)}</p>
                      <p className="text-xs text-muted-foreground">
                        {isVisible ? t('settings.bottomNav.visible') : t('settings.bottomNav.hidden')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    size="md"
                    checked={isVisible}
                    onCheckedChange={() => {
                      if (!disabled) handleBottomNavToggle(feature.view)
                    }}
                    disabled={disabled}
                    aria-label={t(feature.label)}
                    title={disabled ? t('settings.bottomNav.maxVisible' as TranslationKey) : undefined}
                  />
                </div>
              )
            })}
          </div>
        </SettingsSection>

        <SettingsSection
          title={t('settings.pomodoro.title')}
          description={t('settings.pomodoro.note' as TranslationKey)}
          maxWidthClassName="max-w-2xl"
        >
          <SettingsList>
            <SwitchField
              id="auto-start-pomodoro"
              label={t('settings.autoStartPomodoro')}
              description={t('settings.pomodoro.autoStartDescription')}
              checked={settings.autoStartPomodoro}
              onCheckedChange={(checked) => updateSettings({ autoStartPomodoro: checked })}
            />
            <SettingsNumberStepper
              id="focus-duration"
              label={t('settings.pomodoro.focusDuration')}
              value={pomodoroSettings.focusDuration}
              onChange={(raw) => handlePomodoroSettingChange('focusDuration', raw)}
              onStep={(delta) => stepPomodoroSetting('focusDuration', delta)}
              decreaseAriaLabel="Decrease focus duration"
              increaseAriaLabel="Increase focus duration"
            />
            <SettingsNumberStepper
              id="short-break"
              label={t('settings.pomodoro.shortBreak')}
              value={pomodoroSettings.shortBreakDuration}
              onChange={(raw) => handlePomodoroSettingChange('shortBreakDuration', raw)}
              onStep={(delta) => stepPomodoroSetting('shortBreakDuration', delta)}
              decreaseAriaLabel="Decrease short break duration"
              increaseAriaLabel="Increase short break duration"
            />
            <SettingsNumberStepper
              id="long-break"
              label={t('settings.pomodoro.longBreak')}
              value={pomodoroSettings.longBreakDuration}
              onChange={(raw) => handlePomodoroSettingChange('longBreakDuration', raw)}
              onStep={(delta) => stepPomodoroSetting('longBreakDuration', delta)}
              decreaseAriaLabel="Decrease long break duration"
              increaseAriaLabel="Increase long break duration"
            />
            <SettingsNumberStepper
              id="long-break-interval"
              label={t('settings.pomodoro.longBreakInterval')}
              value={pomodoroSettings.sessionsUntilLongBreak}
              onChange={handleIntervalChange}
              onStep={stepInterval}
              decreaseAriaLabel="Decrease sessions until long break"
              increaseAriaLabel="Increase sessions until long break"
            />
          </SettingsList>
        </SettingsSection>

        <NotificationSettings />

        <SettingsSection title={t('settings.ai.title')} maxWidthClassName="max-w-2xl">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-sm text-muted-foreground">{t('settings.ai.serverManaged')}</p>
          </div>
        </SettingsSection>
      </AppPageMain>
    </AppPage>
  )
}

export default SettingsView
