'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { countdownActions } from '@/lib/store/task-manager/actions'
import { useToast } from '@/lib/hooks/use-toast'
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

const calculateTimeLeft = (targetDate: string): CountdownTimeLeft => {
  const target = new Date(targetDate).getTime()
  const now = Date.now()
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

export const useCountdown = () => {
  const { state, dispatch } = useTaskManager()
  const { countdownEvents } = state
  const [tick, setTick] = useState(INITIAL_TICK)
  const { success, error } = useToast()
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set())

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
          new Notification('Countdown Completed!', {
            body: `${event.title} has reached its target time!`,
            icon: '/favicon.ico',
            tag: `countdown-${event.id}`
          })
        }
        
        // Send toast notification
        success('Countdown Completed!', `${event.title} has reached its target time!`)
        
        // Mark as notified to prevent duplicates
        setNotifiedEvents(prev => new Set(prev).add(event.id))
      }
    })
  }, [tick, countdownEvents, notifiedEvents, success])

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

  // Calculate time left for each event
  const eventsWithTimeLeft = useMemo(() => {
    return countdownEvents.map(event => ({
      ...event,
      timeLeft: calculateTimeLeft(event.targetDate),
      colorOption: getColorOption(event.color),
    }))
  }, [countdownEvents])

  // CRUD operations
  const addCountdown = useCallback((countdown: Omit<CountdownEvent, 'id' | 'createdAt'>) => {
    const newCountdown: CountdownEvent = {
      ...countdown,
      id: `cd-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    dispatch(countdownActions.add(newCountdown))
    success('Countdown Added', `${newCountdown.title} has been created successfully`)
  }, [dispatch, success])

  const updateCountdown = useCallback((id: string, updates: Partial<CountdownEvent>) => {
    // First get the existing countdown, then merge updates
    const existingCountdown = countdownEvents.find(c => c.id === id)
    if (existingCountdown) {
      const updatedCountdown: CountdownEvent = {
        ...existingCountdown,
        ...updates,
      }
      dispatch(countdownActions.update(updatedCountdown))
      success('Countdown Updated', `${updatedCountdown.title} has been updated`)
    } else {
      error('Update Failed', 'Countdown not found')
    }
  }, [dispatch, countdownEvents, success, error])

  const deleteCountdown = useCallback((id: string) => {
    const countdownToDelete = countdownEvents.find(c => c.id === id)
    if (countdownToDelete) {
      dispatch(countdownActions.delete(id))
      success('Countdown Deleted', `${countdownToDelete.title} has been removed`)
    } else {
      error('Delete Failed', 'Countdown not found')
    }
  }, [dispatch, countdownEvents, success, error])

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
