'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const buttonClasses =
    'relative border transition-colors shadow-sm ' +
    (resolvedTheme === 'dark'
      ? 'border-primary/60 bg-primary/10 text-primary hover:border-primary'
      : 'border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground')

  const getMenuItemClass = (value: typeof theme) =>
    `flex items-center justify-between w-full ${theme === value ? 'text-primary font-medium' : ''}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" className={buttonClasses}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className={getMenuItemClass('light')} onClick={() => setTheme('light')}>
          Light {theme === 'light' ? '✓' : ''}
        </DropdownMenuItem>
        <DropdownMenuItem className={getMenuItemClass('dark')} onClick={() => setTheme('dark')}>
          Dark {theme === 'dark' ? '✓' : ''}
        </DropdownMenuItem>
        <DropdownMenuItem className={getMenuItemClass('system')} onClick={() => setTheme('system')}>
          System {theme === 'system' ? '✓' : ''}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
