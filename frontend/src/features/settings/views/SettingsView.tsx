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
import { Switch } from '@/components/ui/switch'
import { SwitchField } from '@/components/ui/switch'
import { SettingsList, SettingsNumberStepper } from '@/components/ui/settings-list'
import { SettingsSection } from '@/components/ui/settings-section'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { APP_FEATURES } from '@/lib/navigation/features'
import { cn } from '@/lib/utils'

const SettingsView: React.FC = () => {
  const { theme, setTheme, bottomNavActions, setBottomNavActions, settings, updateSettings } = useSettings()
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

  const handlePomodoroSettingChange = (setting: string, value: string) => {
    const numberValue = parseInt(value, 10)
    if (!isNaN(numberValue) && numberValue >= 1) {
      // UI shows minutes, state stores minutes (not seconds)
      // Only convert to seconds for remainingTime, not for settings
      void updatePomodoroSettings({ [setting]: numberValue })
    }
  }

  const handleIntervalChange = (value: string) => {
    const numberValue = parseInt(value, 10)
    if (!isNaN(numberValue) && numberValue >= 1) {
      void updatePomodoroSettings({ sessionsUntilLongBreak: numberValue })
    }
  }

  const stepPomodoroSetting = (setting: 'focusDuration' | 'shortBreakDuration' | 'longBreakDuration', delta: number) => {
    const current = pomodoroSettings[setting]
    const next = Math.max(1, current + delta)
    void updatePomodoroSettings({ [setting]: next })
  }

  const stepInterval = (delta: number) => {
    const current = pomodoroSettings.sessionsUntilLongBreak
    const next = Math.max(1, current + delta)
    void updatePomodoroSettings({ sessionsUntilLongBreak: next })
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
      <AppPageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        titleSize="md"
      />
      <AppPageMain className="py-4 md:py-6 space-y-8">
        <SettingsSection title={t('settings.languageLabel')} maxWidthClassName="max-w-md">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="font-medium text-sm">{t('settings.languageLabel')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.languageHelper')}</p>
            </div>
            <LanguageToggle showIcon={false} size="md" />
          </div>
        </SettingsSection>

        <SettingsSection title={t('settings.ai.title')}>
          <p className="text-sm text-muted-foreground">
            {t('settings.ai.serverManaged')}
          </p>
        </SettingsSection>

        <SettingsSection title={t('settings.appearance')} maxWidthClassName="" contentClassName="space-y-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="font-medium">{t('settings.themeLabel')}</label>
                <p className="text-sm text-muted-foreground">{t('settings.themePresets.helper')}</p>
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
        </SettingsSection>

        <SettingsSection
          title={t('settings.bottomNav.title')}
          description={t('settings.bottomNav.subtitle')}
          contentClassName="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t('settings.bottomNav.visible')}</h3>
            <span className="text-xs text-muted-foreground">
              {currentActions.length} / {maxVisibleBottomNav}
            </span>
          </div>
          <div className="space-y-1">
            {APP_FEATURES.map((feature) => {
              const isVisible = currentActions.includes(feature.view)
              const Icon = feature.icon
              const disabled = !isVisible && currentActions.length >= maxVisibleBottomNav

              return (
                <div
                  key={feature.view}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5',
                    disabled && 'opacity-50',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{t(feature.label)}</p>
                      <p className="text-xs text-muted-foreground">
                        {isVisible
                          ? t('settings.bottomNav.visible')
                          : t('settings.bottomNav.hidden')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    size="md"
                    checked={isVisible}
                    onCheckedChange={() => {
                      if (disabled) return
                      handleBottomNavToggle(feature.view)
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
        
        <section>
          <h2 className="text-lg font-semibold mb-1">{t('settings.pomodoro.title')}</h2>
          <p className="text-xs text-muted-foreground mb-3">
            {t('settings.pomodoro.note' as TranslationKey)}
          </p>
          <SettingsList className="max-w-md">
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
        </section>
        
        <NotificationSettings />

      </AppPageMain>
    </AppPage>
  )
}

export default SettingsView
