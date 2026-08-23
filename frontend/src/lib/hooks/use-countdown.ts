'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import * as countdownApi from '@/lib/api/countdown'
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

const LEGACY_HEX_COLORS: Record<string, string> = {
  '#3b82f6': 'sky',
  '#2563eb': 'sky',
  '#ef4444': 'sunset',
  '#f97316': 'sunset',
  '#22c55e': 'forest',
  '#10b981': 'forest',
  '#a855f7': 'violet',
  '#8b5cf6': 'violet',
  '#f59e0b': 'amber',
  '#eab308': 'amber',
}

const getColorOption = (value: string | undefined) => {
  const normalized = value
    ? LEGACY_HEX_COLORS[value.toLowerCase()] ?? value
    : COUNTDOWN_COLOR_OPTIONS[0].value
  return COUNTDOWN_COLOR_OPTIONS.find((option) => option.value === normalized) ?? COUNTDOWN_COLOR_OPTIONS[0]
}

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
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isPast: true }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    total: difference,
    isPast: false,
  }
}

export const useCountdown = () => {
  const { state, dispatch } = useTaskManager()
  const { countdownEvents } = state
  const [tick, setTick] = useState(INITIAL_TICK)
  const { success, error } = useToast()
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set())
  const { t } = useI18n()

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const now = Date.now()
    countdownEvents.forEach((event) => {
      const targetTime = new Date(event.targetDate).getTime()
      if (targetTime <= now && targetTime > now - 5000 && !notifiedEvents.has(event.id)) {
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(t('countdown.notifications.completedTitle' as TranslationKey), {
              body: t('countdown.notifications.completedBody' as TranslationKey, { title: event.title }),
              icon: '/favicon.ico',
              tag: `countdown-${event.id}`,
            })
          } catch (notificationError) {
            console.error('Failed to show countdown browser notification', notificationError)
          }
        }

        success(
          t('countdown.notifications.completedTitle' as TranslationKey),
          t('countdown.notifications.completedBody' as TranslationKey, { title: event.title }),
        )
        setNotifiedEvents((previous) => new Set(previous).add(event.id))
      }
    })
  }, [tick, countdownEvents, notifiedEvents, success, t])

  const sortedEvents = useMemo(
    () =>
      [...countdownEvents].sort(
        (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
      ),
    [countdownEvents],
  )

  const { upcomingEvents, completedEvents } = useMemo(() => {
    const upcoming: CountdownEvent[] = []
    const completed: CountdownEvent[] = []

    sortedEvents.forEach((event) => {
      if (new Date(event.targetDate).getTime() > tick) upcoming.push(event)
      else completed.push(event)
    })

    return { upcomingEvents: upcoming, completedEvents: completed }
  }, [sortedEvents, tick])

  const eventsWithTimeLeft = useMemo(
    () =>
      countdownEvents.map((event) => ({
        ...event,
        timeLeft: calculateTimeLeft(event.targetDate, tick),
        colorOption: getColorOption(event.color),
      })),
    [countdownEvents, tick],
  )

  const addCountdown = useCallback(
    async (countdown: Omit<CountdownEvent, 'id' | 'createdAt'>): Promise<boolean> => {
      try {
        const created = await countdownApi.createCountdown({
          title: countdown.title,
          targetDate: countdown.targetDate,
          color: countdown.color,
        })

        if (!created) throw new Error('Create countdown returned no data')

        dispatch(countdownActions.add(created))
        success(
          t('countdown.notifications.addedTitle' as TranslationKey),
          t('countdown.notifications.addedBody' as TranslationKey, { title: created.title }),
        )
        return true
      } catch (caughtError) {
        console.error('Failed to create countdown via API', caughtError)
        error(
          t('countdown.notifications.addFailedTitle' as TranslationKey),
          caughtError instanceof Error
            ? caughtError.message
            : t('countdown.notifications.addFailedBody' as TranslationKey),
        )
        return false
      }
    },
    [dispatch, error, success, t],
  )

  const updateCountdown = useCallback(
    async (id: string, updates: Partial<CountdownEvent>): Promise<boolean> => {
      const existingCountdown = countdownEvents.find((countdown) => countdown.id === id)
      if (!existingCountdown) {
        error(
          t('countdown.notifications.updateFailedTitle' as TranslationKey),
          t('countdown.notifications.updateFailedBody' as TranslationKey),
        )
        return false
      }

      const payload: { title?: string; targetDate?: string; color?: string } = {}
      if (typeof updates.title === 'string') payload.title = updates.title
      if (typeof updates.targetDate === 'string') payload.targetDate = updates.targetDate
      if (typeof updates.color === 'string') payload.color = updates.color

      try {
        const updated = await countdownApi.updateCountdown(id, payload)
        if (!updated) throw new Error('Update countdown returned no data')

        dispatch(countdownActions.update(updated))
        success(
          t('countdown.notifications.updatedTitle' as TranslationKey),
          t('countdown.notifications.updatedBody' as TranslationKey, { title: updated.title }),
        )
        return true
      } catch (caughtError) {
        console.error('Failed to update countdown via API', caughtError)
        error(
          t('countdown.notifications.updateFailedTitle' as TranslationKey),
          caughtError instanceof Error
            ? caughtError.message
            : t('countdown.notifications.updateFailedBody' as TranslationKey),
        )
        return false
      }
    },
    [countdownEvents, dispatch, error, success, t],
  )

  const deleteCountdown = useCallback(
    async (id: string): Promise<boolean> => {
      const countdownToDelete = countdownEvents.find((countdown) => countdown.id === id)
      if (!countdownToDelete) {
        error(
          t('countdown.notifications.deleteFailedTitle' as TranslationKey),
          t('countdown.notifications.deleteFailedBody' as TranslationKey),
        )
        return false
      }

      try {
        await countdownApi.deleteCountdown(id)
        dispatch(countdownActions.delete(id))
        success(
          t('countdown.notifications.deletedTitle' as TranslationKey),
          t('countdown.notifications.deletedBody' as TranslationKey, { title: countdownToDelete.title }),
        )
        return true
      } catch (caughtError) {
        console.error('Failed to delete countdown via API', caughtError)
        error(
          t('countdown.notifications.deleteFailedTitle' as TranslationKey),
          caughtError instanceof Error
            ? caughtError.message
            : t('countdown.notifications.deleteFailedBody' as TranslationKey),
        )
        return false
      }
    },
    [countdownEvents, dispatch, error, success, t],
  )

  const createFormState = useCallback(() => {
    const defaultColor = COUNTDOWN_COLOR_OPTIONS[0].value
    return { name: '', date: null as Date | null, color: defaultColor }
  }, [])

  const resetFormState = useCallback(
    (setter: (state: CountdownFormState) => void) => setter(createFormState()),
    [createFormState],
  )

  return {
    countdownEvents,
    upcomingEvents,
    completedEvents,
    eventsWithTimeLeft,
    tick,
    colorOptions: COUNTDOWN_COLOR_OPTIONS,
    getColorOption,
    addCountdown,
    updateCountdown,
    deleteCountdown,
    createFormState,
    resetFormState,
    calculateTimeLeft,
  }
}

export type { CountdownColorOption, CountdownTimeLeft }
