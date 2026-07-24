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
