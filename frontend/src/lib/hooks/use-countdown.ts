'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { countdownActions } from '@/lib/store/task-manager/actions'
import { useToast } from '@/lib/hooks/use-toast'
import { useI18n } from '@/lib/i18n/hooks'
import type { CountdownEvent } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'

const INITIAL_TICK = Date.now()

type CountdownColorOption = {
  value: string
  labelKey: TranslationKey
  gradient: string
  accent: string
  softLayer: string
  border: string
}

type CountdownFormState = {
  name: string
  date: Date | null
  color: string
}

type CountdownApiItem = {
  id?: unknown
  Id?: unknown
  title?: unknown
  Title?: unknown
  targetDate?: unknown
  TargetDate?: unknown
  color?: unknown
  Color?: unknown
  createdAt?: unknown
  CreatedAt?: unknown
}

function toIsoDateString(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }

  return new Date().toISOString()
}

const COUNTDOWN_COLOR_OPTIONS: CountdownColorOption[] = [
  {
    value: 'sky',
    labelKey: 'countdown.colors.sky',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.35), rgba(147,197,253,0.28))',
    accent: 'rgba(56,189,248,1)',
    softLayer: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.9)',
  },
  {
    value: 'sunset',
    labelKey: 'countdown.colors.sunset',
    gradient: 'linear-gradient(135deg, rgba(248,113,113,0.35), rgba(250,204,21,0.24))',
    accent: 'rgba(239,68,68,1)',
    softLayer: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.9)',
  },
  {
    value: 'forest',
    labelKey: 'countdown.colors.forest',
    gradient: 'linear-gradient(135deg, rgba(45,212,191,0.32), rgba(110,231,183,0.2))',
    accent: 'rgba(34,197,94,1)',
    softLayer: 'rgba(52,211,153,0.12)',
    border: 'rgba(34,197,94,0.9)',
  },
  {
    value: 'violet',
    labelKey: 'countdown.colors.violet',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.32), rgba(244,114,182,0.22))',
    accent: 'rgba(168,85,247,1)',
    softLayer: 'rgba(192,132,252,0.12)',
    border: 'rgba(168,85,247,0.9)',
  },
  {
    value: 'amber',
    labelKey: 'countdown.colors.amber',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.35), rgba(253,230,138,0.22))',
    accent: 'rgba(245,158,11,1)',
    softLayer: 'rgba(251,191,36,0.12)',
    border: 'rgba(245,158,11,0.9)',
  },
] as const

const getColorOption = (value: string | undefined) =>
  COUNTDOWN_COLOR_OPTIONS.find(option => option.value === value) ?? COUNTDOWN_COLOR_OPTIONS[0]

interface CountdownTimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
  isPast: boolean
}

const calculateTimeLeft = (targetDate: string, now: number = Date.now()): CountdownTimeLeft => {
  const target = new Date(targetDate).getTime()
  const difference = target - now

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isPast: true,
    }
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((difference % (1000 * 60)) / 1000)

  return {
    days,
    hours,
    minutes,
    seconds,
    total: difference,
    isPast: false,
  }
}

function mapCountdownsFromApi(items: unknown[]): CountdownEvent[] {
  return items.map((item) => {
    const c = item as CountdownApiItem

    const id = String(c.id ?? c.Id ?? '')
    const title = String(c.title ?? c.Title ?? '')
    const targetRaw = c.targetDate ?? c.TargetDate
    const targetDate = toIsoDateString(targetRaw)
    const color = String(c.color ?? c.Color ?? 'sky')
    const createdRaw = c.createdAt ?? c.CreatedAt
    const createdAt = toIsoDateString(createdRaw)

    return {
      id,
      title,
      targetDate,
      color,
      createdAt,
    }
  })
}

export const useCountdown = () => {
  const { state, dispatch } = useTaskManager()
  const { countdownEvents } = state
  const [tick, setTick] = useState(INITIAL_TICK)
  const { success, error } = useToast()
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set())
  const { t } = useI18n()

  // Update tick every second for live countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Check for completed countdowns and send notifications
  useEffect(() => {
    const now = Date.now()
    countdownEvents.forEach(event => {
      const targetTime = new Date(event.targetDate).getTime()
      
      // Check if countdown just completed (within last 5 seconds)
      if (targetTime <= now && targetTime > now - 5000 && !notifiedEvents.has(event.id)) {
        // Send browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(
            t('countdown.notifications.completedTitle' as TranslationKey),
            {
              body: t('countdown.notifications.completedBody' as TranslationKey, { title: event.title }),
              icon: '/favicon.ico',
              tag: `countdown-${event.id}`
            },
          )
        }
        
        // Send toast notification
        success(
          t('countdown.notifications.completedTitle' as TranslationKey),
          t('countdown.notifications.completedBody' as TranslationKey, { title: event.title }),
        )
        
        // Mark as notified to prevent duplicates
        setNotifiedEvents(prev => new Set(prev).add(event.id))
      }
    })
  }, [tick, countdownEvents, notifiedEvents, success, t])

  // Memoized sorted events
  const sortedEvents = useMemo(() => {
    return [...countdownEvents].sort((a, b) => {
      const dateA = new Date(a.targetDate).getTime()
      const dateB = new Date(b.targetDate).getTime()
      return dateA - dateB
    })
  }, [countdownEvents])

  // Separate upcoming and completed events
  const { upcomingEvents, completedEvents } = useMemo(() => {
    const now = tick
    const upcoming: CountdownEvent[] = []
    const completed: CountdownEvent[] = []

    sortedEvents.forEach(event => {
      if (new Date(event.targetDate).getTime() > now) {
        upcoming.push(event)
      } else {
        completed.push(event)
      }
    })

    return { upcomingEvents: upcoming, completedEvents: completed }
  }, [sortedEvents, tick])

  // Calculate time left for each event (recomputed on every tick so UI stays live)
  const eventsWithTimeLeft = useMemo(() => {
    return countdownEvents.map(event => ({
      ...event,
      timeLeft: calculateTimeLeft(event.targetDate, tick),
      colorOption: getColorOption(event.color),
    }))
  }, [countdownEvents, tick])

  // CRUD operations
  const addCountdown = useCallback(async (countdown: Omit<CountdownEvent, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/countdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: countdown.title,
          targetDate: countdown.targetDate,
          color: countdown.color,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create countdown: ${response.status}`)
      }

      const createdJson = await response.json()
      const mapped = mapCountdownsFromApi([createdJson])
      const created = mapped[0] ?? null

      if (created) {
        dispatch(countdownActions.add(created))
        success(
          t('countdown.notifications.addedTitle' as TranslationKey),
          t('countdown.notifications.addedBody' as TranslationKey, { title: created.title }),
        )
        return
      }
    } catch (e) {
      console.error('Failed to create countdown via API', e)
      error(
        t('countdown.notifications.addFailedTitle' as TranslationKey),
        e instanceof Error ? e.message : t('countdown.notifications.addFailedBody' as TranslationKey),
      )
    }
  }, [dispatch, error, t])

  const updateCountdown = useCallback(async (id: string, updates: Partial<CountdownEvent>) => {
    const existingCountdown = countdownEvents.find(c => c.id === id)
    if (!existingCountdown) {
      error(
        t('countdown.notifications.updateFailedTitle' as TranslationKey),
        t('countdown.notifications.updateFailedBody' as TranslationKey),
      )
      return
    }

    const payload: { title?: string; targetDate?: string; color?: string } = {}
    if (typeof updates.title === 'string') payload.title = updates.title
    if (typeof updates.targetDate === 'string') payload.targetDate = updates.targetDate
    if (typeof updates.color === 'string') payload.color = updates.color

    try {
      const response = await fetch(`/api/countdown/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to update countdown: ${response.status}`)
      }

      const updatedJson = await response.json()
      const mapped = mapCountdownsFromApi([updatedJson])
      const updated = mapped[0] ?? { ...existingCountdown, ...updates }

      dispatch(countdownActions.update(updated))
      success(
        t('countdown.notifications.updatedTitle' as TranslationKey),
        t('countdown.notifications.updatedBody' as TranslationKey, { title: updated.title }),
      )
    } catch (e) {
      console.error('Failed to update countdown via API, falling back to local state', e)
      const updatedCountdown: CountdownEvent = {
        ...existingCountdown,
        ...updates,
      }
      dispatch(countdownActions.update(updatedCountdown))
      success(
        t('countdown.notifications.updatedTitle' as TranslationKey),
        t('countdown.notifications.updatedBody' as TranslationKey, { title: updatedCountdown.title }),
      )
    }
  }, [dispatch, countdownEvents, success, error, t])

  const deleteCountdown = useCallback(async (id: string) => {
    const countdownToDelete = countdownEvents.find(c => c.id === id)
    if (!countdownToDelete) {
      error(
        t('countdown.notifications.deleteFailedTitle' as TranslationKey),
        t('countdown.notifications.deleteFailedBody' as TranslationKey),
      )
      return
    }

    try {
      const response = await fetch(`/api/countdown/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete countdown: ${response.status}`)
      }
    } catch (e) {
      console.error('Failed to delete countdown via API, deleting locally', e)
    }

    dispatch(countdownActions.delete(id))
    success(
      t('countdown.notifications.deletedTitle' as TranslationKey),
      t('countdown.notifications.deletedBody' as TranslationKey, { title: countdownToDelete.title }),
    )
  }, [dispatch, countdownEvents, success, error, t])

  // Form state helpers
  const createFormState = useCallback(() => {
    const defaultColor = COUNTDOWN_COLOR_OPTIONS[0].value
    return {
      name: '',
      date: null as Date | null,
      color: defaultColor,
    }
  }, [])

  const resetFormState = useCallback((setter: (state: CountdownFormState) => void) => {
    setter(createFormState())
  }, [createFormState])

  return {
    // Data
    countdownEvents,
    upcomingEvents,
    completedEvents,
    eventsWithTimeLeft,
    tick,
    
    // Configuration
    colorOptions: COUNTDOWN_COLOR_OPTIONS,
    getColorOption,
    
    // Actions
    addCountdown,
    updateCountdown,
    deleteCountdown,
    
    // Form helpers
    createFormState,
    resetFormState,
    
    // Utilities
    calculateTimeLeft,
  }
}

export type { CountdownColorOption, CountdownTimeLeft }
