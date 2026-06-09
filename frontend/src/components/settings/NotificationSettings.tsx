'use client'

import React from 'react'
import { useSettings } from '@/components/providers/settings-provider'
import { useToast } from '@/lib/hooks/use-toast'
import { useI18n } from '@/lib/i18n/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { BellIcon, BellOffIcon, Volume2Icon, VolumeXIcon } from 'lucide-react'

export const NotificationSettings: React.FC = () => {
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()
  const { success, error } = useToast()

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
    if (!('Notification' in window)) {
      error(
        t('settings.notifications.notSupportedTitle'),
        t('settings.notifications.notSupportedDescription')
      )
      return
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
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
      // Play a test sound
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
          {/* Master Notification Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="notifications-enabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('settings.notifications.enabled')}
              </label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.enabledDescription')}
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings.notifications}
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          <Separator />

          {/* Browser Notifications */}
          <div className={`space-y-4 ${!settings.notifications ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-medium leading-none">{t('settings.notifications.browser')}</span>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notifications.browserDescription')}
                </p>
              </div>
              <Badge variant={Notification.permission === 'granted' ? 'default' : 'secondary'}>
                {Notification.permission === 'granted' 
                  ? t('settings.notifications.permitted')
                  : t('settings.notifications.notPermitted')
                }
              </Badge>
            </div>
            <Button 
              variant="outline" 
              onClick={handleBrowserNotificationTest}
              className="w-full"
            >
              {t('settings.notifications.testBrowser')}
            </Button>
          </div>

          {/* Toast Notifications */}
          <div className={`space-y-4 ${!settings.notifications ? 'opacity-50 pointer-events-none' : ''}`}>
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
            >
              {t('settings.notifications.testToast')}
            </Button>
          </div>

          <Separator />

          {/* Sound Settings */}
          <div className={`space-y-4 ${!settings.notifications ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="sound-enabled" className="text-sm font-medium leading-none flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2Icon className="h-4 w-4" /> : <VolumeXIcon className="h-4 w-4" />}
                  {t('settings.notifications.sound')}
                </label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notifications.soundDescription')}
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled || false}
                onCheckedChange={handleSoundToggle}
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className={`space-y-4 ${!settings.notifications ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-sm font-medium leading-none">{t('settings.notifications.types')}</span>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('settings.notifications.taskReminders')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.notifications.taskRemindersDescription')}
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('settings.notifications.countdownCompletions')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.notifications.countdownCompletionsDescription')}
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('settings.notifications.taskActions')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.notifications.taskActionsDescription')}
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
