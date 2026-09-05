import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const src = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), 'src', relativePath), 'utf8')

describe('animation contracts', () => {
  it('replaces faux accordion keyframes with safe mount animations', () => {
    const sidebar = src('components/layout/sidebar.tsx')
    expect(sidebar).not.toContain('animate-accordion-down')
    expect(sidebar).toContain('animate-in fade-in-0 slide-in-from-top-1')
    expect(sidebar).toContain('duration-200 overflow-hidden motion-reduce:animate-none')

    const taskItem = src('features/tasks/components/TaskItem.tsx')
    expect(taskItem).not.toContain('animate-accordion-down')
    expect(taskItem).toContain('animate-in fade-in-0 slide-in-from-top-1 duration-200 motion-reduce:animate-none')

    const taskList = src('features/tasks/components/TaskList.tsx')
    expect(taskList).not.toContain('animate-accordion-down')
    expect(taskList).toContain('animate-in fade-in-0 slide-in-from-top-1 duration-200')
    expect(taskList).toContain('overflow-hidden sm:p-4 motion-reduce:animate-none')
  })

  it('honors reduced-motion on interactive transforms', () => {
    const dashboard = src('app/(app)/dashboard/page.tsx')
    expect(dashboard).toContain('motion-reduce:hover:translate-y-0')

    const listView = src('features/tasks/views/ListView.tsx')
    expect(listView).toContain('motion-reduce:hover:scale-100 motion-reduce:active:scale-100')

    const countdown = src('features/countdown/views/CountdownView.tsx')
    expect(countdown).toContain('motion-reduce:hover:scale-100')

    const listEditDialog = src('components/layout/list-edit-dialog.tsx')
    expect(listEditDialog).toContain('motion-reduce:hover:scale-100')

    const taskItem = src('features/tasks/components/TaskItem.tsx')
    expect(taskItem).toContain("isReadOnly ? 'cursor-not-allowed opacity-60' : 'hover:scale-105 motion-reduce:hover:scale-100'")
  })

  it('keeps the pomodoro progress ring visually in sync with one-second ticks', () => {
    expect(src('features/pomodoro/views/PomodoroFocusView.tsx')).toContain(
      'transition-[stroke-dashoffset] duration-150 ease-linear motion-reduce:transition-none',
    )
  })

  it('keeps task detail mounted long enough to play close animation cleanly', () => {
    const layout = src('app/(app)/layout.tsx')
    expect(layout).toContain('const [renderedTaskDetailId, setRenderedTaskDetailId] = useState<string | null>(null)')
    expect(layout).toContain('const [isTaskDetailVisible, setTaskDetailVisible] = useState(false)')
    expect(layout).toContain("dispatch({ type: 'SET_SELECTED_TASK', payload: null })")
    expect(layout).toContain('if (event.target === event.currentTarget)')
    expect(layout).toContain('className={`relative h-full w-full transition-transform duration-300 ease-in-out motion-reduce:transition-none md:max-w-xl')
    expect(layout).toContain('window.setTimeout(() => {')
    expect(layout).toContain('<TaskDetail taskId={renderedTaskDetailId} />')

    const taskDetail = src('features/tasks/components/TaskDetail.tsx')
    expect(taskDetail).not.toContain('md:animate-slide-in')
  })

  it('applies reduced-motion fallbacks to sidebar overlay, panel, and chevrons', () => {
    const sidebar = src('components/layout/sidebar.tsx')
    expect(sidebar).toContain('transition-opacity motion-reduce:transition-none')
    expect(sidebar).toContain('transition-transform md:transition-all duration-300 ease-in-out motion-reduce:transition-none')
    expect(sidebar).toContain('transition-transform motion-reduce:transition-none')
  })

  it('aligns countdown ticking with real second boundaries and skips idle timers', () => {
    const countdownHook = src('lib/hooks/use-countdown.ts')
    expect(countdownHook).toContain('const hasUpcomingEvents = countdownEvents.some')
    expect(countdownHook).toContain('const delayToNextSecond = 1000 - (Date.now() % 1000)')
    expect(countdownHook).toContain('window.setTimeout(startTicking, delayToNextSecond)')
    expect(countdownHook).toContain('window.setInterval(() => setTick(Date.now()), 1000)')
  })
})
