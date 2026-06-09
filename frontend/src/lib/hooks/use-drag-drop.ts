'use client'

import { useState, useCallback } from 'react'

interface DragDropItem<T = unknown> {
  id: string
  data?: T
}

interface DragDropConfig<T = unknown> {
  items?: DragDropItem<T>[]
  onDrop?: (itemId: string, targetData: unknown) => void
  onDragStart?: (itemId: string) => void
  onDragEnd?: () => void
}

interface UseDragDropReturn {
  // State
  draggedItemId: string | null
  dragOverTarget: string | null
  
  // Actions
  setDraggedItemId: (id: string | null) => void
  setDragOverTarget: (target: string | null) => void
  
  // Event handlers
  handleDragStart: (e: React.DragEvent, itemId: string) => void
  handleDragEnd: () => void
  handleDragOver: (e: React.DragEvent, targetKey: string) => void
  handleDragLeave: (e: React.DragEvent, targetKey: string) => void
  handleDrop: (e: React.DragEvent, targetData: unknown) => void
  
  // Utilities
  isDragging: (itemId: string) => boolean
  isDragOver: (targetKey: string) => boolean
}

export const useDragDrop = <T = unknown>(config?: DragDropConfig<T>): UseDragDropReturn => {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)

  // Event handlers
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('draggedItemId', itemId)
    setDraggedItemId(itemId)
    config?.onDragStart?.(itemId)
  }, [config])

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null)
    setDragOverTarget(null)
    config?.onDragEnd?.()
  }, [config])

  const handleDragOver = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault()
    setDragOverTarget(targetKey)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault()
    // Only clear if we're leaving the current target
    if (dragOverTarget === targetKey) {
      setDragOverTarget(null)
    }
  }, [dragOverTarget])

  const handleDrop = useCallback((e: React.DragEvent, targetData: unknown) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('draggedItemId')
    
    if (itemId && config?.onDrop) {
      config.onDrop(itemId, targetData)
    }
    
    handleDragEnd()
  }, [config, handleDragEnd])

  // Utilities
  const isDragging = useCallback((itemId: string) => {
    return draggedItemId === itemId
  }, [draggedItemId])

  const isDragOver = useCallback((targetKey: string) => {
    return dragOverTarget === targetKey
  }, [dragOverTarget])

  return {
    // State
    draggedItemId,
    dragOverTarget,
    
    // Actions
    setDraggedItemId,
    setDragOverTarget,
    
    // Event handlers
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    
    // Utilities
    isDragging,
    isDragOver,
  }
}

// Specialized hook for task dragging
export const useTaskDragDrop = (onDropTask: (taskId: string, targetData: unknown) => void) => {
  return useDragDrop({
    onDrop: onDropTask,
  })
}

// Specialized hook for calendar date dragging
export const useCalendarDragDrop = (onDropOnDate: (taskId: string, date: Date) => void) => {
  return useDragDrop({
    onDrop: (taskId, targetData) => {
      if (targetData instanceof Date) {
        onDropOnDate(taskId, targetData)
      }
    },
  })
}

export type { DragDropItem, DragDropConfig, UseDragDropReturn }
