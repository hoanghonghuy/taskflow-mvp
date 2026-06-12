'use client'

import React, { useState } from 'react'
import { useSettings } from '@/components/providers/settings-provider'
import { useToast } from '@/lib/hooks/use-toast'
import { useI18n } from '@/lib/i18n/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SwitchField } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { BellIcon, BellOffIcon, Volume2Icon, VolumeXIcon } from 'lucide-react'

function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export const NotificationSettings: React.FC = () => {
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()
  const { success, error } = useToast()

  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() =>
    typeof window === 'undefined' ? 'unsupported' : getBrowserNotificationPermission(),
  )

  const handleNotificationToggle = (enabled: boolean) => {
    updateSettings({ notifications: enabled })
    success(
      enabled
        ? t('settings.notifications.toggleOnTitle')
        : t('settings.notifications.toggleOffTitle'),
      enabled
        ? t('settings.notifications.toggleOnDescription')
        : t('settings.notifications.toggleOffDescription')
    )
  }

  const handleBrowserNotificationTest = async () => {
    if (notificationPermission === 'unsupported') {
      error(
        t('settings.notifications.notSupportedTitle'),
        t('settings.notifications.notSupportedDescription')
      )
      return
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationPermission('granted')
        new Notification(t('settings.notifications.testNotificationTitle'), {
          body: t('settings.notifications.testNotificationBody'),
          icon: '/favicon.ico'
        })
        success(
          t('settings.notifications.permissionGrantedTitle'),
          t('settings.notifications.permissionGrantedDescription')
        )
      } else {
        error(
          t('settings.notifications.permissionDeniedTitle'),
          t('settings.notifications.permissionDeniedDescription')
        )
      }
    } else if (Notification.permission === 'granted') {
      new Notification(t('settings.notifications.testNotificationTitle'), {
        body: t('settings.notifications.testNotificationBody'),
        icon: '/favicon.ico'
      })
      success(
        t('settings.notifications.testBrowserSuccessTitle'),
        t('settings.notifications.testBrowserSuccessDescription')
      )
    } else {
      error(
        t('settings.notifications.permissionDeniedTitle'),
        t('settings.notifications.permissionDeniedSettingsDescription')
      )
    }
  }

  const handleToastTest = () => {
    success(
      t('settings.notifications.toastTestTitle'),
      t('settings.notifications.toastTestDescription')
    )
  }

  const handleSoundToggle = (enabled: boolean) => {
    updateSettings({ soundEnabled: enabled })
    if (enabled) {
      const audio = new Audio('/notification-sound.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        error(
          t('settings.notifications.soundErrorTitle'),
          t('settings.notifications.soundErrorDescription')
        )
      })
      success(
        t('settings.notifications.soundEnabledTitle'),
        t('settings.notifications.soundEnabledDescription')
      )
    } else {
      success(
        t('settings.notifications.soundDisabledTitle'),
        t('settings.notifications.soundDisabledDescription')
      )
    }
  }

  const notificationsDisabled = !settings.notifications
  const alwaysOnHint = t('settings.notifications.typeAlwaysOnHint')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.notifications ? <BellIcon className="h-5 w-5" /> : <BellOffIcon className="h-5 w-5" />}
            {t('settings.notifications.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.notifications.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SwitchField
            id="notifications-enabled"
            label={t('settings.notifications.enabled')}
            description={t('settings.notifications.enabledDescription')}
            checked={settings.notifications}
            onCheckedChange={handleNotificationToggle}
          />

          <Separator />

          <div className={`space-y-4 ${notificationsDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <span className="text-sm font-medium leading-none">{t('settings.notifications.browser')}</span>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notifications.browserDescription')}
                </p>
              </div>
              <Badge variant={notificationPermission === 'granted' ? 'default' : 'secondary'}>
                {notificationPermission === 'granted'
                  ? t('settings.notifications.permitted')
                  : t('settings.notifications.notPermitted')}
              </Badge>
            </div>
            <Button
              variant="outline"
              onClick={handleBrowserNotificationTest}
              className="w-full"
              disabled={notificationsDisabled}
            >
              {t('settings.notifications.testBrowser')}
            </Button>
          </div>

          <div className={`space-y-4 ${notificationsDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-0.5">
              <span className="text-sm font-medium leading-none">{t('settings.notifications.toast')}</span>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.toastDescription')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleToastTest}
              className="w-full"
              disabled={notificationsDisabled}
            >
              {t('settings.notifications.testToast')}
            </Button>
          </div>

          <Separator />

          <div className={notificationsDisabled ? 'opacity-50 pointer-events-none' : ''}>
            <SwitchField
              id="sound-enabled"
              label={
                <span className="inline-flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2Icon className="h-4 w-4" /> : <VolumeXIcon className="h-4 w-4" />}
                  {t('settings.notifications.sound')}
                </span>
              }
              description={t('settings.notifications.soundDescription')}
              checked={settings.soundEnabled || false}
              onCheckedChange={handleSoundToggle}
              disabled={notificationsDisabled}
              disabledReason={notificationsDisabled ? t('settings.notifications.enableMasterFirst') : undefined}
            />
          </div>

          <div className={`space-y-4 ${notificationsDisabled ? 'opacity-50' : ''}`}>
            <span className="text-sm font-medium leading-none">{t('settings.notifications.types')}</span>
            <div className="grid gap-4">
              <SwitchField
                id="notify-task-reminders"
                label={t('settings.notifications.taskReminders')}
                description={t('settings.notifications.taskRemindersDescription')}
                defaultChecked
                disabled
                disabledReason={alwaysOnHint}
              />
              <SwitchField
                id="notify-countdown"
                label={t('settings.notifications.countdownCompletions')}
                description={t('settings.notifications.countdownCompletionsDescription')}
                defaultChecked
                disabled
                disabledReason={alwaysOnHint}
              />
              <SwitchField
                id="notify-task-actions"
                label={t('settings.notifications.taskActions')}
                description={t('settings.notifications.taskActionsDescription')}
                defaultChecked
                disabled
                disabledReason={alwaysOnHint}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
