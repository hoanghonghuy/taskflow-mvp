'use client'

import React from 'react'
import { useI18n } from '@/lib/hooks/use-i18n'
import type { List } from '@/types'
import { CloseIcon } from '@/lib/icons'

interface ShareListModalProps {
  list: List
  onClose: () => void
}

const ShareListModal: React.FC<ShareListModalProps> = ({ list, onClose }) => {
  const { t } = useI18n()

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <header className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {t('shareList.title', { listName: list.name })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('shareList.subtitle')}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            {t('shareList.unavailable')}
          </p>
        </div>

        <footer className="p-4 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            {t('shareList.done')}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ShareListModal
