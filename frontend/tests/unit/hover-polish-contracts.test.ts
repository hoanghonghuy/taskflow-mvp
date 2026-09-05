import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const src = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), 'src', relativePath), 'utf8')

describe('hover polish contracts', () => {
  it('adds visible hover feedback to shared segmented controls', () => {
    expect(src('components/ui/segmented-control.tsx')).toContain(
      'cursor-pointer inline-flex items-center justify-center font-medium transition-colors',
    )
    expect(src('components/ui/segmented-control.tsx')).toContain(
      "false: 'text-muted-foreground hover:bg-background/60 hover:text-foreground'",
    )
  })

  it('adds hover feedback to the feature bar profile trigger', () => {
    expect(src('components/layout/feature-bar.tsx')).toContain(
      'cursor-pointer rounded-full p-1 transition-colors hover:bg-muted/60',
    )
  })

  it('adds hover feedback to the mobile sidebar trigger', () => {
    expect(src('app/(app)/layout.tsx')).toContain(
      'cursor-pointer rounded-md p-2 transition-colors hover:bg-muted/50',
    )
  })

  it('makes dashboard summary cards feel more obviously interactive on hover', () => {
    const dashboard = src('app/(app)/dashboard/page.tsx')
    expect(dashboard).toContain('cursor-pointer')
    expect(dashboard).toContain('transition-[border-color,background-color,box-shadow,transform]')
    expect(dashboard).toContain('hover:bg-muted/20')
    expect(dashboard).toContain('hover:-translate-y-0.5')
    expect(dashboard).toContain('hover:border-primary/40')
    expect(dashboard).toContain('hover:shadow-sm')
  })

  it('uses pointer cursor for clickable dashboard task rows', () => {
    const dashboard = src('app/(app)/dashboard/page.tsx')
    expect(dashboard).toContain('cursor-pointer flex w-full')
    expect(dashboard).toContain('hover:bg-secondary/60')
    expect(dashboard).toContain('group-hover:translate-x-0.5')
  })

  it('keeps task-like rows consistent across list, calendar, board, and sidebar', () => {
    const taskItem = src('features/tasks/components/TaskItem.tsx')
    expect(taskItem).toContain('hover:bg-muted/20 hover:border-border hover:shadow-sm')
    expect(taskItem).toContain('min-w-0 flex-1 cursor-pointer text-left')

    const taskList = src('features/tasks/components/TaskList.tsx')
    expect(taskList).toContain('cursor-pointer flex min-h-12 w-full')
    expect(taskList).toContain('hover:bg-secondary/60')

    const calendar = src('features/calendar/views/CalendarView.tsx')
    expect(calendar).toContain('cursor-pointer flex min-h-14 w-full')
    expect(calendar).toContain('hover:bg-muted/60')

    const sidebar = src('components/layout/sidebar.tsx')
    expect(sidebar).toContain('cursor-pointer flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60')

    const board = src('features/board/components/BoardColumn.tsx')
    expect(board).toContain('cursor-pointer flex min-w-0 grow items-center justify-between')
    expect(board).toContain('hover:bg-muted/60')
  })

  it('keeps sidebar nav items responsive on hover even when active', () => {
    expect(src('components/layout/sidebar.tsx')).toContain(
      "? 'bg-muted text-foreground font-medium hover:bg-muted/70'",
    )
  })

  it('adds hover feedback to interactive calendar day cells and search results', () => {
    const calendar = src('features/calendar/views/CalendarView.tsx')
    expect(calendar).toContain('cursor-pointer relative min-h-[54px]')
    expect(calendar).toContain('hover:bg-muted/30')
    expect(calendar).toContain('hover:bg-muted/40')

    const search = src('features/search/components/SearchModal.tsx')
    expect(search).toContain(
      'rounded-xl transition-colors hover:bg-muted/20',
    )
  })

  it('uses pointer cursor on shared button primitives', () => {
    expect(src('components/ui/button.tsx')).toContain('cursor-pointer inline-flex')
    expect(src('components/ui/button.tsx')).toContain(
      "default: 'bg-primary text-primary-foreground shadow hover:bg-primary hover:shadow-md'",
    )
    expect(src('components/ui/icon-button.tsx')).toContain('cursor-pointer inline-flex')
  })

  it('does not need ad-hoc primary hover overrides in task list actions', () => {
    const taskList = src('features/tasks/components/TaskList.tsx')
    expect(taskList).not.toContain('hover:bg-primary hover:opacity-90')
  })
})
