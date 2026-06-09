"use client"

import * as React from 'react'
import { CalendarDaysIcon } from '@/lib/icons'
import { useI18n } from '@/lib/hooks/use-i18n'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  min?: Date
  placeholder?: string
}

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)

const clampToMin = (date: Date, min?: Date) => {
  if (!min) return date
  return date < min ? new Date(min) : date
}

export function DateTimePicker({
  value,
  onChange,
  min,
  placeholder,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const { t } = useI18n()

  const handleDateSelect = (date?: Date) => {
    if (!date) return
    const base = value ?? min ?? new Date()
    const next = new Date(date)
    next.setHours(base.getHours(), base.getMinutes(), 0, 0)
    onChange(clampToMin(next, min))
  }

  const handleTimeChange = (time: string) => {
    if (!time) return
    const [hours, minutes] = time.split(':').map(Number)
    const base = value ?? min ?? new Date()
    const next = new Date(base)
    next.setHours(hours, minutes, 0, 0)
    onChange(clampToMin(next, min))
  }

  const timeValue = value
    ? value.toISOString().slice(11, 16)
    : (min ?? new Date()).toISOString().slice(11, 16)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn(
            'justify-between px-4 py-2 rounded-lg border border-border bg-background text-foreground w-full font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {value ? formatDateTime(value) : (placeholder ?? t('datePicker.placeholder'))}
          <CalendarDaysIcon className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-dtp-content="true"
        className="w-[320px] space-y-4 p-4 rounded-xl border border-border bg-card shadow-xl"
        align="end"
      >
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={handleDateSelect}
          disabled={
            min
              ? {
                  before: new Date(
                    min.getFullYear(),
                    min.getMonth(),
                    min.getDate()
                  ),
                }
              : undefined
          }
        />
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange(min ? new Date(min) : new Date())}
          >
            {t('common.today')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

