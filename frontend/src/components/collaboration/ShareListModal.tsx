'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useListActions } from '@/components/providers/task-manager-provider'
import { useUser } from '@/components/providers/user-provider'
import { useI18n } from '@/lib/i18n/hooks'
import * as authApi from '@/lib/api/auth'
import type { List, User } from '@/types'
import { CloseIcon } from '@/lib/icons'
import { Avatar } from '@/components/ui/avatar'

interface ShareListModalProps {
  list: List
  onClose: () => void
}

const ShareListModal: React.FC<ShareListModalProps> = ({ list, onClose }) => {
  const { t } = useI18n()
  const { user, allUsers, refreshCollaborators } = useUser()
  const { shareList, unshareList } = useListActions()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    void refreshCollaborators()
  }, [refreshCollaborators])

  const memberUsers = useMemo(() => {
    return list.members.map((memberId) => {
      const found = allUsers.find((u) => u.id === memberId)
      if (found) return found
      return { id: memberId, name: t('comments.unknownUser'), email: '' } satisfies User
    })
  }, [allUsers, list.members, t])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) return

    setInviteError(null)
    setIsInviting(true)

    try {
      const found = await authApi.lookupUserByEmail(email)
      if (!found) {
        setInviteError(t('shareList.userNotFound'))
        return
      }

      if (list.members.includes(found.id)) {
        setInviteError(t('shareList.alreadyMember'))
        return
      }

      const ok = await shareList(list.id, found.id)
      if (ok) {
        await refreshCollaborators()
        setInviteEmail('')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('shareList.inviteFailed')
      if (message.toLowerCase().includes('yourself') || message.toLowerCase().includes('invite yourself')) {
        setInviteError(t('shareList.cannotInviteSelf'))
      } else {
        setInviteError(message)
      }
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId)
    try {
      const ok = await unshareList(list.id, memberId)
      if (ok) {
        await refreshCollaborators()
      }
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold">
              {t('shareList.title', { listName: list.name })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('shareList.subtitle')}
            </p>
            <p className="text-xs text-muted-foreground/90 mt-1">
              {t('shareList.readOnlyNotice')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('shareList.members')}
            </h3>
            <div className="space-y-2">
              {user && (
                <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/40">
                  <Avatar user={user} className="w-8 h-8" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{t('shareList.owner')}</span>
                </div>
              )}
              {memberUsers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30">
                  <Avatar user={member} className="w-8 h-8" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <button
                    type="button"
                    disabled={removingId === member.id}
                    onClick={() => void handleRemove(member.id)}
                    className="text-xs text-destructive hover:underline disabled:opacity-50 shrink-0"
                    aria-label={t('shareList.aria.removeMember', { memberName: member.name })}
                  >
                    {t('shareList.remove')}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('shareList.invite')}
            </h3>
            <form onSubmit={handleInvite} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value)
                    setInviteError(null)
                  }}
                  placeholder={t('shareList.inviteEmailPlaceholder')}
                  className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isInviting}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 shrink-0"
                >
                  {t('shareList.inviteButton')}
                </button>
              </div>
              {inviteError && (
                <p className="text-xs text-destructive" role="alert">
                  {inviteError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{t('shareList.inviteHint')}</p>
            </form>
          </section>
        </div>

        <footer className="p-4 border-t border-border flex justify-end shrink-0">
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
