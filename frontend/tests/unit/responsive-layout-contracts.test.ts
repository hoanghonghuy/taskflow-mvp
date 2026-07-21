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
})
