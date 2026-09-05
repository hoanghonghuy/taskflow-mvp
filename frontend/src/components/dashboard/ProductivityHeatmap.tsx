'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/i18n/hooks'
import { useSettings } from '@/components/providers/settings-provider'
import { useTheme } from '@/components/providers/theme-provider'
import type { FocusSession } from '@/types'

const CELL_SIZE = 12 // w-3
const CELL_GAP = 4   // gap-1
const WEEK_WIDTH = CELL_SIZE + CELL_GAP
const AXIS_GAP = 12  // gap-3 between day labels and heatmap grid

/** Format local date thành YYYY-MM-DD. Tránh UTC của toISOString() lệch ngày
 *  với user ở múi giờ dương/âm (khớp với backend `todayDateString()` VN). */
function toLocalYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** CN + T2–T7 — vừa cột nhãn, không wrap như "Thứ 2". */
const VI_DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const

function dayLabelsWidth(language: string): number {
  return language === 'vi' ? 28 : 30
}

const LIGHT_SCALE = [
  'var(--color-heatmap-light-0)',
  'var(--color-heatmap-light-1)',
  'var(--color-heatmap-light-2)',
  'var(--color-heatmap-light-3)',
  'var(--color-heatmap-light-4)',
]

const DARK_SCALE = [
  'var(--color-heatmap-dark-0)',
  'var(--color-heatmap-dark-1)',
  'var(--color-heatmap-dark-2)',
  'var(--color-heatmap-dark-3)',
  'var(--color-heatmap-dark-4)',
]
const FUTURE_OPACITY = 0.35
const EMPTY_FOCUS_HISTORY: FocusSession[] = []

const ProductivityHeatmap: React.FC = () => {
  const { state } = useTaskManager()
  const { t } = useI18n()
  const { settings } = useSettings()
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Get container width on resize
  useEffect(() => {
    // Set initial width with a small delay to ensure DOM is ready
    const setInitialWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        if (width > 0) {
          setContainerWidth(width)
        } else {
          // Retry if width is still 0
          setTimeout(setInitialWidth, 100)
        }
      }
    }
    
    setInitialWidth()
    
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width)
      }
    })
    const currentRef = containerRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  const focusHistory = state.pomodoro?.focusHistory ?? EMPTY_FOCUS_HISTORY

  const { contributions, maxContribution } = useMemo(() => {
    const contribs: { [date: string]: { tasks: number, pomos: number, total: number } } = {}
    let max = 1

    // Count completed tasks
    state.tasks.forEach(task => {
      if (task.completed && task.completedAt) {
        const dateStr = toLocalYMD(new Date(task.completedAt))
        if (!contribs[dateStr]) contribs[dateStr] = { tasks: 0, pomos: 0, total: 0 }
        contribs[dateStr].tasks += 1
        contribs[dateStr].total += 2
        if (contribs[dateStr].total > max) max = contribs[dateStr].total
      }
    })

    // Count pomodoro sessions
    focusHistory.forEach(session => {
      if (session?.startTime) {
        const dateStr = toLocalYMD(new Date(session.startTime))
        if (!contribs[dateStr]) contribs[dateStr] = { tasks: 0, pomos: 0, total: 0 }
        contribs[dateStr].pomos += 1
        contribs[dateStr].total += 1
        if (contribs[dateStr].total > max) max = contribs[dateStr].total
      }
    })

    return { contributions: contribs, maxContribution: max }
  }, [state.tasks, focusHistory])

  // Calculate which days and month labels to show based on width
  const { weeks, monthLabels, dayLabels, labelsWidth } = useMemo(() => {
    const labelsWidth = dayLabelsWidth(settings.language)
    const localDayLabels =
      settings.language === 'vi'
        ? [...VI_DAY_LABELS]
        : Array.from({ length: 7 }, (_, i) => {
            const day = new Date(2024, 0, 7 + i)
            return day.toLocaleDateString(settings.language, { weekday: 'short' })
          })

    // Use a minimum width if containerWidth is 0 to ensure heatmap renders
    const effectiveWidth = containerWidth > 0 ? containerWidth : 400

    const availableWidth =
      effectiveWidth > labelsWidth + AXIS_GAP
        ? effectiveWidth - labelsWidth - AXIS_GAP
        : 0
    const numWeeks = Math.max(1, Math.min(52, Math.floor(availableWidth / WEEK_WIDTH)))
    
    const today = new Date()
    const endDate = new Date(today)
    // Align to the end of the week (Saturday) to ensure full columns
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const days = []
    for (let i = 0; i < numWeeks * 7; i++) {
      const date = new Date(endDate)
      date.setDate(endDate.getDate() - i)
      days.push(date)
    }
    days.reverse()
    
    const weeksData = []
    const labels: { label: string, index: number }[] = []
    let lastMonth = -1

    for (let i = 0; i < numWeeks; i++) {
      const week = days.slice(i * 7, (i + 1) * 7)
      weeksData.push(week)

      // Find month label
      const firstDayOfWeek = week[0]
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.getMonth()
        if (month !== lastMonth) {
          const lastLabelIndex = labels.length > 0 ? labels[labels.length - 1].index : -5
          // Heuristic to prevent label overlap on smaller screens
          if (i > lastLabelIndex + 3) {
            const monthLabel = settings.language === 'vi'
              ? `T${month + 1}`
              : firstDayOfWeek.toLocaleDateString(settings.language, { month: 'short' })
            labels.push({ label: monthLabel, index: i })
            lastMonth = month
          }
        }
      }
    }
    
    return { weeks: weeksData, monthLabels: labels, dayLabels: localDayLabels, labelsWidth }

  }, [containerWidth, settings.language])
  
  const getColorIndex = (count: number) => {
    if (count === 0) return 0
    const ratio = count / maxContribution
    if (ratio < 0.25) return 1
    if (ratio < 0.5) return 2
    if (ratio < 0.75) return 3
    return 4
  }

  const getCellStyle = (count: number, isFuture: boolean) => {
    const palette = resolvedTheme === 'dark' ? DARK_SCALE : LIGHT_SCALE
    const index = getColorIndex(count)
    const color = palette[index]
    if (isFuture) {
      return {
        backgroundColor: palette[0],
        borderColor: palette[0],
        opacity: FUTURE_OPACITY,
      }
    }
    return {
      backgroundColor: color,
      borderColor: palette[index === 0 ? 0 : index],
      opacity: 1,
    }
  }
  
  const getTooltipText = (date: Date) => {
    const dateStr = toLocalYMD(date)
    const data = contributions[dateStr]
    const formattedDate = date.toLocaleDateString(settings.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    
    if (!data || data.total === 0) {
      return t('heatmap.tooltip.noActivity', { date: formattedDate })
    }
    
    return t('heatmap.tooltip.activity', {
      date: formattedDate,
      tasksCount: data.tasks,
      pomosCount: data.pomos
    })
  }

  return (
    <div ref={containerRef} className="overflow-hidden">
      <div className="flex flex-col">
        {/* Month Labels */}
        <div className="h-5 mb-1 relative" style={{ marginLeft: `${labelsWidth}px` }}>
          {monthLabels.map(({ label, index }) => (
            <div
              key={label + index}
              className="absolute top-0 text-xs text-muted-foreground"
              style={{ left: `${index * WEEK_WIDTH}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {/* Day Labels */}
          <div
            className="flex flex-col gap-1 text-xs text-muted-foreground pt-0.5 shrink-0"
            style={{ width: `${labelsWidth}px` }}
          >
            <div className="h-3" aria-hidden />
            <div className="h-3 whitespace-nowrap leading-3">{dayLabels[1]}</div>
            <div className="h-3" aria-hidden />
            <div className="h-3 whitespace-nowrap leading-3">{dayLabels[3]}</div>
            <div className="h-3" aria-hidden />
            <div className="h-3 whitespace-nowrap leading-3">{dayLabels[5]}</div>
            <div className="h-3" aria-hidden />
          </div>

          {/* Heatmap Grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={`empty-${weekIndex}-${dayIndex}`} className="w-3 h-3" />
                  }
                  const date = day as Date
                  const count = contributions[toLocalYMD(date)]?.total || 0
                  const isFuture = date > new Date()

                  return (
                    <div
                      key={date.toISOString()}
                      className="w-3 h-3 rounded-[3px] border transition-all duration-200"
                      style={getCellStyle(count, isFuture)}
                      title={isFuture ? t('heatmap.tooltip.future') : getTooltipText(date)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductivityHeatmap

