'use client'

import React, { useEffect, useState } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import type { Task } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'
import { CloseIcon, SearchIcon } from '@/lib/icons'
import TaskItem from '@/features/tasks/components/TaskItem'
import { useRouter } from 'next/navigation'
import { getSearchMatchMeta } from '@/lib/utils/search-helpers'
import { HighlightText } from '@/components/ui/highlight-text'
import * as tasksApi from '@/lib/api/tasks'

interface SearchModalProps {
  onClose: () => void
}

const matchFieldLabels: Record<string, TranslationKey> = {
  description: 'search.matchInDescription',
  tag: 'search.matchInTag',
  subtask: 'search.matchInSubtask',
  comment: 'search.matchInComment',
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Task[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const trimmedTerm = searchTerm.trim()
  // Derive empty UI from the query so we never sync-clear state inside an effect.
  const activeResults = trimmedTerm ? searchResults : []
  const activeError = trimmedTerm ? searchError : null
  const activeSearching = trimmedTerm ? isSearching : false

  useEffect(() => {
    if (!trimmedTerm) {
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsSearching(true)
      setSearchError(null)

      void tasksApi
        .searchTasks(trimmedTerm)
        .then((results) => {
          if (!cancelled) {
            setSearchResults(results)
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setSearchResults([])
            setSearchError(error instanceof Error ? error.message : t('search.error'))
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false)
          }
        })
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [trimmedTerm, t])

  const handleTaskSelect = (task: Task) => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: task.id })
    if (task.listId) {
      dispatch({ type: 'SET_ACTIVE_LIST', payload: task.listId })
      router.push('/list')
    }
    onClose()
  }

  const getListName = (listId: string): string => {
    if (listId === 'inbox') {
      return t('specialLists.inbox')
    }
    const list = state.lists.find(l => l.id === listId)
    return list ? list.name : ''
  }

  return (
    <div 
      className="fixed inset-0 bg-background/90 z-40 flex justify-center p-4 sm:p-6 md:p-12 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-full max-h-[80vh]" 
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center border-b border-border">
          <SearchIcon className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-transparent text-lg focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary ml-4">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>
        
        <div className="grow p-4 overflow-y-auto">
          {!trimmedTerm && (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <p className="text-sm">{t('search.hintEmpty')}</p>
              <p className="text-xs">{t('search.hintScopes')}</p>
              <p className="text-xs">{t('search.serverHint')}</p>
            </div>
          )}
          {trimmedTerm && activeSearching && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {t('search.loading')}
            </div>
          )}
          {trimmedTerm && activeError && !activeSearching && (
            <div className="text-center py-12 text-destructive text-sm">
              {activeError}
            </div>
          )}
          {trimmedTerm && !activeSearching && !activeError && activeResults.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('search.noResults', { searchTerm: trimmedTerm })}</p>
            </div>
          )}
          {trimmedTerm && !activeSearching && !activeError && activeResults.length > 0 && (
            <p className="text-xs text-muted-foreground mb-3">
              {t('search.resultCount', { count: activeResults.length })}
            </p>
          )}
          <div className="space-y-2">
            {!activeSearching && !activeError && activeResults.map(task => {
              const matchMeta = getSearchMatchMeta(task, trimmedTerm)
              return (
                <div key={task.id} onClick={() => handleTaskSelect(task)} className="cursor-pointer">
                  <TaskItem 
                    task={task} 
                    isDraggable={false} 
                    listName={getListName(task.listId)}
                    highlightTerm={trimmedTerm}
                  />
                  {matchMeta && (
                    <p className="text-xs text-muted-foreground px-3 -mt-1 mb-1">
                      {t(matchFieldLabels[matchMeta.field])}:{' '}
                      <HighlightText text={matchMeta.snippet} term={trimmedTerm} />
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchModal
