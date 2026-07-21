'use client'

import React, { useEffect, useState } from 'react'
import type { List } from '@/types'
import { useI18n } from '@/lib/i18n/hooks'
import { useListActions } from '@/components/providers/task-manager-provider'
import { useToast } from '@/components/providers/toast-provider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export const LIST_COLOR_PRESETS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6b7280',
] as const

interface ListEditDialogProps {
  list: List | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ListEditDialog({ list, open, onOpenChange }: ListEditDialogProps) {
  const { t } = useI18n()
  const { updateList } = useListActions()
  const addToast = useToast()
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(LIST_COLOR_PRESETS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!list) return
    setName(list.name)
    setColor(list.color || LIST_COLOR_PRESETS[0])
  }, [list])

  const handleSave = async () => {
    if (!list) return
    const trimmed = name.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      const updated = await updateList({ id: list.id, name: trimmed, color })
      if (updated) {
        addToast.success(t('sidebar.editList.success', { listName: trimmed }))
        onOpenChange(false)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('sidebar.editList.title')}</DialogTitle>
          <DialogDescription>{t('sidebar.editList.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="list-edit-name" className="text-sm font-medium">
              {t('sidebar.editList.nameLabel')}
            </label>
            <input
              id="list-edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('sidebar.editList.colorLabel')}</p>
            <div className="flex flex-wrap gap-2">
              {LIST_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={t('sidebar.editList.colorOption', { color: preset })}
                  onClick={() => setColor(preset)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 ${
                    color === preset ? 'border-foreground ring-2 ring-primary/40' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving || !name.trim()}>
              {t('sidebar.editList.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
