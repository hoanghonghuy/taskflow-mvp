'use client'

import React from 'react'
import BoardView from '@/features/board/views/BoardView'
import { useModal } from '@/components/providers/modal-provider'

export default function BoardPage() {
  const { openTaskForm } = useModal()
  return <BoardView onOpenTaskForm={openTaskForm} />
}

