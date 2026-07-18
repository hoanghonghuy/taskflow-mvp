import type { ComponentType } from 'react'
import {
  CalendarDaysIcon,
  GridIcon,
  HomeIcon,
  HourglassIcon,
  ListBulletIcon,
  RepeatIcon,
  StopwatchIcon,
  ViewColumnsIcon,
} from '@/lib/icons'
import type { TranslationKey } from '@/lib/i18n/types'
import type { View } from '@/types'

export type AppFeature = {
  view: View
  icon: ComponentType<{ className?: string }>
  label: TranslationKey
}

/** Single source for feature rail / bottom nav / settings toggles. */
export const APP_FEATURES: AppFeature[] = [
  { view: 'dashboard', icon: HomeIcon, label: 'feature.dashboard' },
  { view: 'list', icon: ListBulletIcon, label: 'feature.listView' },
  { view: 'board', icon: ViewColumnsIcon, label: 'feature.boardView' },
  { view: 'calendar', icon: CalendarDaysIcon, label: 'feature.calendarView' },
  { view: 'matrix', icon: GridIcon, label: 'feature.matrixView' },
  { view: 'habit', icon: RepeatIcon, label: 'feature.habitTracker' },
  { view: 'pomodoro', icon: StopwatchIcon, label: 'feature.pomodoro' },
  { view: 'countdown', icon: HourglassIcon, label: 'feature.countdown' },
]

export function getPathForView(view: View): string {
  if (view === 'dashboard') return '/dashboard'
  if (view === 'habit') return '/habits'
  return `/${view}`
}

/** Map pathname → View id used in settings / bottom nav. */
export function getViewFromPathname(pathname: string | null): View {
  if (!pathname || pathname === '/' || pathname === '/dashboard') return 'dashboard'
  if (pathname === '/habits') return 'habit'
  const segment = pathname.slice(1).split('/')[0]
  const match = APP_FEATURES.find((f) => f.view === segment || getPathForView(f.view) === `/${segment}`)
  return (match?.view ?? segment) as View
}
