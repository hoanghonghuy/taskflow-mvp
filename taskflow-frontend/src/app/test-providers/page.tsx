'use client'

import { useTheme } from '@/components/providers/theme-provider'
import { useUser } from '@/components/providers/user-provider'
import { useSettings } from '@/components/providers/settings-provider'
import { useToast } from '@/lib/hooks/use-toast'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import { useI18n } from '@/lib/hooks/use-i18n'
import { Button } from '@/components/ui/button'

export default function TestProvidersPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { user, isAuthenticated, login, logout } = useUser()
  const { settings, updateSettings } = useSettings()
  const { toast } = useToast()
  const { confirm } = useConfirmation()
  const { t, currentLanguage, toggleLanguage } = useI18n()

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Providers Test Page</h1>

      {/* Theme Provider */}
      <div className="space-y-2 p-4 border rounded">
        <h2 className="text-xl font-semibold">Theme Provider</h2>
        <p>Current: {theme} (Resolved: {resolvedTheme})</p>
        <div className="flex gap-2">
          <Button onClick={() => setTheme('light')} size="sm">Light</Button>
          <Button onClick={() => setTheme('dark')} size="sm">Dark</Button>
          <Button onClick={() => setTheme('system')} size="sm">System</Button>
        </div>
      </div>

      {/* User Provider */}
      <div className="space-y-2 p-4 border rounded">
        <h2 className="text-xl font-semibold">User Provider</h2>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        {user && <p>User: {user.name} ({user.email})</p>}
        <div className="flex gap-2">
          {!isAuthenticated ? (
            <Button onClick={() => login('test@example.com', 'password')} size="sm">
              Mock Login
            </Button>
          ) : (
            <Button onClick={logout} size="sm" variant="destructive">
              Logout
            </Button>
          )}
        </div>
      </div>

      {/* Settings Provider */}
      <div className="space-y-2 p-4 border rounded">
        <h2 className="text-xl font-semibold">Settings Provider</h2>
        <p>Language: {settings.language}</p>
        <p>Notifications: {settings.notifications ? 'On' : 'Off'}</p>
        <Button
          onClick={() => updateSettings({ notifications: !settings.notifications })}
          size="sm"
        >
          Toggle Notifications
        </Button>
      </div>

      {/* Toast Provider */}
      <div className="space-y-2 p-4 border rounded">
        <h2 className="text-xl font-semibold">Toast Provider</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => toast({ title: 'Success!', description: 'This is a success toast', variant: 'success' })}
            size="sm"
          >
            Success Toast
          </Button>
          <Button
            onClick={() => toast({ title: 'Error!', description: 'This is an error toast', variant: 'destructive' })}
            size="sm"
            variant="destructive"
          >
            Error Toast
          </Button>
        </div>
      </div>

      {/* Confirmation Provider */}
      <div className="space-y-2 p-4 border rounded">
        <h2 className="text-xl font-semibold">Confirmation Provider</h2>
        <Button
          onClick={async () => {
            const confirmed = await confirm({
              title: 'Are you sure?',
              description: 'This action cannot be undone.',
              confirmText: 'Yes, delete',
              cancelText: 'Cancel',
              variant: 'destructive',
            })
            toast({
              title: confirmed ? 'Confirmed!' : 'Cancelled',
              description: confirmed ? 'You clicked confirm' : 'You clicked cancel',
            })
          }}
          size="sm"
        >
          Test Confirmation
        </Button>
      </div>

      {/* i18n Provider */}
      <div className="space-y-2 p-4 border rounded">
        <h2 className="text-xl font-semibold">i18n Provider</h2>
        <p>Language: {currentLanguage}</p>
        <p>Translation test: {t('app.tagline')}</p>
        <Button onClick={toggleLanguage} size="sm">
          Toggle Language
        </Button>
      </div>
    </div>
  )
}
