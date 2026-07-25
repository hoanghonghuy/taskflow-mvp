import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const src = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), 'src', relativePath), 'utf8')

describe('responsive layout contracts', () => {
  it('uses dynamic viewport height for full-screen app shells', () => {
    expect(src('app/(app)/layout.tsx')).toContain('h-dvh')
    expect(src('components/layout/app-loading-skeleton.tsx')).toContain('h-dvh')

    const fullScreenSources = [
      'app/(app)/not-found.tsx',
      'app/(app)/error.tsx',
      'app/(auth)/login/page.tsx',
      'app/(auth)/register/page.tsx',
      'app/(auth)/forgot-password/page.tsx',
      'app/admin/layout.tsx',
      'components/landing/LandingPage.tsx',
      'components/layout/task-column-shell.tsx',
      'features/board/views/BoardView.tsx',
    ]
    for (const file of fullScreenSources) {
      expect(src(file)).not.toMatch(/(?:min-h-screen|100vh)/)
    }
  })

  it('keeps frequently used touch actions at least 44px on mobile', () => {
    expect(src('features/habits/views/HabitsView.tsx')).toContain('size-11')
    expect(src('components/layout/sidebar.tsx')).toContain('size-11')
    expect(src('features/tasks/components/TaskDetail.tsx')).toContain('size-11')
  })

  it('does not hide the subtask delete action behind hover on touch screens', () => {
    expect(src('features/tasks/components/TaskDetail.tsx')).toContain(
      'opacity-100 md:opacity-0 md:group-hover:opacity-100',
    )
  })

  it('places the Board list selector in the mobile app header', () => {
    expect(src('features/board/views/BoardView.tsx')).toContain('MobileHeaderActions')
    expect(src('app/(app)/layout.tsx')).toContain('mobile-header-actions')
  })

  it('uses the default page and card spacing scale', () => {
    expect(src('app/(app)/dashboard/page.tsx')).toContain(
      '<AppPageMain className="py-4 md:py-6">',
    )
    expect(src('features/pomodoro/views/PomodoroView.tsx')).toContain(
      '<AppPageMain className="py-4 md:py-6">',
    )
    expect(src('app/(app)/dashboard/page.tsx')).not.toContain('rounded-lg p-5')

    const habitCards = src('features/habits/views/HabitsView.tsx')
    expect(habitCards).toContain('rounded-lg p-6 shadow-sm')
    expect(habitCards).not.toContain('rounded-2xl p-5')

    expect(src('features/profile/views/ProfileView.tsx')).toContain(
      'bg-card border border-border rounded-lg p-6',
    )
    expect(src('features/achievements/views/AchievementsView.tsx')).toContain(
      'rounded-lg p-6',
    )
  })

  it('prefers shared Button / IconButton for common profile and habit actions', () => {
    const profile = src('features/profile/views/ProfileView.tsx')
    expect(profile).toContain("from '@/components/ui/button'")
    expect(profile).toMatch(/<Button[\s\S]*profile\.save/)
    expect(profile).toMatch(/<Button[\s\S]*profile\.cancel/)

    const habits = src('features/habits/views/HabitsView.tsx')
    expect(habits).toContain("from '@/components/ui/icon-button'")
    expect(habits).toContain('variant="destructive"')
    expect(habits).toContain("aria-label={t('habits.aria.deleteHabit')}")
  })

  it('applies shared radius, elevation, motion, and focus polish', () => {
    const statCard = src('components/ui/stat-card.tsx')
    expect(statCard).toContain(
      "variant === 'compact' && 'rounded-lg border border-border bg-card p-4 shadow-sm'",
    )
    expect(statCard).not.toContain('rounded-2xl border border-border bg-card p-4')

    const achievements = src('features/achievements/views/AchievementsView.tsx')
    expect(achievements).toContain(
      'transition-[opacity,filter,box-shadow] duration-200',
    )
    expect(achievements).not.toContain('transition-all duration-300')
    expect(achievements).toContain('font-semibold text-lg')

    const settings = src('features/settings/views/SettingsView.tsx')
    expect(settings).toContain(
      'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4',
    )
    expect(settings).toContain(
      'group flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
    )

    const featureBar = src('components/layout/feature-bar.tsx')
    expect(featureBar).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    )
    expect(featureBar).not.toContain(
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
    )
  })

  it('cleans leftover Phase 3 polish on list, calendar, and chrome', () => {
    const calendar = src('features/calendar/views/CalendarView.tsx')
    expect(calendar).not.toContain('rounded-2xl')
    expect(calendar).toContain('rounded-xl overflow-hidden shadow-sm')
    expect(calendar).toContain('rounded-lg p-4 shadow-sm')

    const taskList = src('features/tasks/components/TaskList.tsx')
    expect(taskList).not.toContain('rounded-2xl')
    expect(taskList).toContain('grid grid-cols-2 sm:grid-cols-4 gap-4')
    expect(taskList).toContain('rounded-lg border border-border/60')

    const taskItem = src('features/tasks/components/TaskItem.tsx')
    expect(taskItem).toContain(
      'transition-[box-shadow,background-color,opacity] duration-200 ease-in-out',
    )
    expect(taskItem).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    )
    expect(taskItem).not.toContain(
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    )

    const listView = src('features/tasks/views/ListView.tsx')
    expect(listView).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    )
    expect(listView).not.toContain(
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    )

    const skeleton = src('components/layout/page-skeleton.tsx')
    expect(skeleton).not.toMatch(/habits[\s\S]*rounded-2xl/)
    expect(skeleton).toContain('rounded-lg border border-border bg-card p-6 shadow-sm')

    expect(src('components/layout/sidebar.tsx')).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
    )
    expect(src('features/tasks/components/TaskDetail.tsx')).toContain(
      'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    )
    expect(src('features/countdown/views/CountdownView.tsx')).toContain(
      'flex flex-col gap-4 rounded-lg border border-border-subtle/80',
    )
    expect(src('components/auth/profile-dropdown.tsx')).toContain('shadow-lg')
    expect(src('components/auth/profile-dropdown.tsx')).not.toContain('shadow-2xl')
    expect(src('features/tasks/components/TaskForm.tsx')).toContain('shadow-lg w-full max-w-lg')
    expect(src('features/tasks/components/TaskForm.tsx')).not.toContain('shadow-xl w-full max-w-lg')
    expect(src('features/profile/views/ProfileView.tsx')).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    )
  })

  it('finishes Low polish on modals and create fields', () => {
    for (const file of [
      'components/briefing/DailyBriefingModal.tsx',
      'components/chatbot/Chatbot.tsx',
      'components/collaboration/ShareListModal.tsx',
      'features/search/components/SearchModal.tsx',
      'features/pomodoro/views/PomodoroView.tsx',
      'components/layout/bottom-nav-bar.tsx',
      'components/ui/date-time-picker.tsx',
    ]) {
      expect(src(file)).not.toContain('shadow-xl')
      expect(src(file)).toContain('shadow-lg')
    }

    expect(src('features/pomodoro/views/PomodoroView.tsx')).not.toContain('rounded-2xl shadow')
    expect(src('features/pomodoro/views/PomodoroView.tsx')).toContain('rounded-xl shadow-lg')

    expect(src('features/board/views/BoardView.tsx')).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    )
    expect(src('features/board/views/BoardView.tsx')).not.toContain(
      'focus:outline-none focus:ring-2 focus:ring-primary',
    )
    expect(src('features/habits/views/HabitsView.tsx')).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    )
    expect(src('features/habits/views/HabitsView.tsx')).not.toContain(
      'focus:outline-none focus:ring-2 focus:ring-primary',
    )
    expect(src('components/layout/list-edit-dialog.tsx')).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    )
    expect(src('features/tasks/components/TaskForm.tsx')).not.toContain(
      'focus:outline-none focus:ring-2 focus:ring-primary/50',
    )
    expect(src('features/tasks/components/TaskForm.tsx')).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    )
  })

  it('avoids escaped quotes in Button svg size selectors for Tailwind CSS parsing', () => {
    const button = src('components/ui/button.tsx')
    expect(button).toContain('[&_svg:not([class*=size-])]:size-4')
    expect(button).not.toContain("class*='size-")
    expect(button).not.toContain('class*="size-')
  })

  it('reserves bottom-nav space and keeps page titles consistent on mobile', () => {
    expect(src('components/layout/app-page.tsx')).toContain(
      'pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6',
    )
    expect(src('components/layout/app-page-header.tsx')).toContain('hideOnMobile = true')

    const achievements = src('features/achievements/views/AchievementsView.tsx')
    expect(achievements).toContain('AppPageMain')
    expect(achievements).toContain('AppPageHeader')
    expect(achievements).not.toMatch(/<main className="flex-1 p-4 md:p-6/)

    expect(src('features/calendar/views/CalendarView.tsx')).toContain(
      'text-2xl md:text-3xl font-bold',
    )
    expect(src('features/calendar/views/CalendarView.tsx')).not.toContain(
      'text-xl md:text-3xl font-bold',
    )
  })

  it('lets unhandled task drops bubble to Board and Matrix containers', () => {
    expect(src('features/tasks/components/TaskItem.tsx').replace(/\r/g, '')).toContain(
      'if (canDrag && onDrop) {\n      e.stopPropagation()',
    )
    expect(src('features/board/components/BoardColumn.tsx')).not.toContain(
      'onDrop={() => {}}',
    )
  })

  it('keeps primary task controls keyboard accessible', () => {
    expect(src('features/tasks/components/TaskItem.tsx')).toContain(
      'aria-label={task.title}',
    )
    expect(src('features/calendar/views/CalendarView.tsx').replace(/\r/g, '')).toContain(
      '<button\n        type="button"\n        key={task.id}',
    )
    expect(src('features/pomodoro/views/PomodoroView.tsx')).toContain(
      'aria-label={t(\'pomodoro.selectTask\')}',
    )
    expect(src('components/layout/sidebar.tsx')).toContain(
      'if (e.target !== e.currentTarget) return',
    )
    expect(src('components/layout/sidebar.tsx')).toContain('inert={!isOpen}')
    expect(src('components/ui/icon-button.tsx')).toContain(
      'md:group-focus-within:opacity-100',
    )
    expect(src('components/ui/icon-button.tsx')).toContain(
      "sm: 'size-11 p-0.5 md:size-7'",
    )
    const taskDetail = src('features/tasks/components/TaskDetail.tsx')
    expect(taskDetail).toContain('<AccessibleModalSurface')
    expect(taskDetail).toContain('aria-label={task.title}')
    expect(taskDetail).toContain('handleMoveTag')
    expect(taskDetail).toContain('handleMoveSubtask')
    expect(taskDetail).toContain("t('common.moveUp')")
    expect(taskDetail).toContain("t('common.moveDown')")
    expect(src('features/board/views/BoardView.tsx')).toContain('handleMoveColumn')
    expect(src('features/board/components/BoardColumn.tsx')).toContain(
      'onMoveColumn',
    )
    const calendar = src('features/calendar/views/CalendarView.tsx')
    expect(calendar).toContain("aria-current={isTodayDate ? 'date' : undefined}")
    expect(calendar).toContain('aria-pressed={isSelectedDate}')
    expect(calendar).toContain('borderLeftColor: bg')
    expect(calendar).not.toContain('rounded-md text-background')
  })

  it('names close and send icon buttons', () => {
    for (const file of [
      'features/tasks/components/TaskForm.tsx',
      'features/search/components/SearchModal.tsx',
      'components/briefing/DailyBriefingModal.tsx',
      'components/collaboration/ShareListModal.tsx',
      'components/chatbot/Chatbot.tsx',
    ]) {
      expect(src(file)).toContain("aria-label={t('common.close')}")
    }
    expect(src('components/chatbot/Chatbot.tsx')).toContain(
      "aria-label={t('chatbot.send')}",
    )
  })

  it('associates task form and detail fields with accessible names', () => {
    const taskForm = src('features/tasks/components/TaskForm.tsx')
    expect(taskForm).toContain('htmlFor="task-form-title"')
    expect(taskForm).toContain('id="task-form-title"')
    expect(taskForm).toContain('htmlFor="task-form-description"')
    expect(taskForm).toContain('id="task-form-description"')

    const taskDetail = src('features/tasks/components/TaskDetail.tsx')
    expect(taskDetail).toContain("aria-label={t('taskDetail.titleLabel'")
    expect(taskDetail).toContain('controlId="task-priority"')

    const propertyList = src('components/ui/property-list.tsx')
    expect(propertyList).toContain('controlId?: string')
    expect(propertyList).toContain('htmlFor={controlId}')
  })

  it('announces dynamic loading, errors and results', () => {
    expect(src('components/layout/app-loading-skeleton.tsx')).toContain(
      'aria-live="polite"',
    )
    expect(src('app/(app)/layout.tsx')).toContain('role="alert"')
    expect(src('features/search/components/SearchModal.tsx')).toContain(
      'aria-live="polite"',
    )
    expect(src('components/chatbot/Chatbot.tsx')).toContain(
      'aria-live="polite"',
    )
  })

  it('prevents remaining narrow and short viewport overflows', () => {
    expect(src('app/layout.tsx')).toContain("viewportFit: 'cover'")
    expect(src('app/globals.css')).toContain('@media (prefers-reduced-motion: reduce)')
    expect(src('features/habits/views/HabitsView.tsx')).toContain(
      'mt-4 flex flex-col gap-2 sm:flex-row',
    )
    expect(src('features/pomodoro/views/PomodoroView.tsx')).toContain(
      'flex flex-wrap items-center justify-center gap-4',
    )
    expect(src('components/layout/feature-bar.tsx')).toContain('overflow-y-auto')
    expect(src('components/layout/bottom-nav-bar.tsx')).toContain(
      'max-w-full truncate',
    )
    expect(src('components/layout/bottom-nav-bar.tsx')).toContain('text-xs')
    expect(src('features/calendar/views/CalendarView.tsx')).toContain(
      'text-left text-xs px-2',
    )
    expect(src('components/layout/task-column-shell.tsx')).toContain(
      "'min-h-[160px] md:min-h-[260px]'",
    )
    expect(src('components/layout/app-loading-skeleton.tsx')).toContain(
      'hidden w-64 shrink-0 border-r border-border p-4 lg:block',
    )
  })

  it('discovers the Board E2E spec in the Chromium project', () => {
    const playwrightConfig = readFileSync(
      path.join(process.cwd(), 'playwright.config.ts'),
      'utf8',
    )
    expect(playwrightConfig).toMatch(
      /tasks\|navigation\|board\|habits\|countdown/,
    )
    expect(playwrightConfig).toContain('failOnFlakyTests: !!process.env.CI')

    const boardE2e = readFileSync(
      path.join(process.cwd(), 'e2e/board.spec.ts'),
      'utf8',
    )
    expect(boardE2e).toContain('page.waitForResponse')
    expect(boardE2e).toContain('response.ok()')
  })

  it('exposes real app loading and ready markers to E2E', () => {
    expect(src('components/layout/app-loading-skeleton.tsx')).toContain(
      'data-testid="app-loading"',
    )
    expect(src('app/(app)/layout.tsx')).toContain('data-testid="app-shell"')

    const readinessHelper = readFileSync(
      path.join(process.cwd(), 'e2e/helpers/app-ready.ts'),
      'utf8',
    )
    expect(readinessHelper).toContain("getByTestId('app-loading')")
    expect(readinessHelper).toContain("getByTestId('app-shell')")
    expect(readinessHelper).not.toContain("getByText('Loading...')")
  })
})
